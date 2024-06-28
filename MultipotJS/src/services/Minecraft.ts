import Logger from "@/util/Logger.js";
import * as fs from 'fs';
import { Service } from "./Service.js";

import MinecraftData from "minecraft-data";
import minecraftProtocol from 'minecraft-protocol';
import { dirname } from "path";
import prismarineChunkLoader, { PCChunk } from 'prismarine-chunk';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Minecraft extends Service {
    constructor({ enabled = false, reportip = false, discord_webhook }) {
        super({ service_name: 'minecraft', port: 25565, enabled, reportip, discord_webhook });
    }

    async start() {
        const server = minecraftProtocol.createServer({
            motd: '\u00A7eMinecraft Survival SMP Server w Fr\u00A7ki\u00A7r\u00A7eends',
            'online-mode': true,

            port: 25565, // optional
            version: '1.16',
        });

        const mcData = MinecraftData(server.version)
        const loginPacket = mcData.loginPacket;

        const Chunk = prismarineChunkLoader(server.version);
        const chunk: PCChunk = new Chunk()
        chunk.load(await fs.readFileSync(__dirname + '/../../other/chunk.dump'), 25, true);

        server.on('login', async (client) => {
            let fallCounter = 0;
            const playerName = client.profile.name;
            const clientIP = client.socket.remoteAddress!;
            let locationStr = this.ip2Loc(clientIP);

            await this.saveDB(clientIP, playerName, 'unknown', locationStr);
            this.sendDiscordMsg(playerName, '', clientIP, locationStr);
            const grieferCount = await this.db_uniqueAttackCount();

            client.write('login', loginParams());
            setPosition(); // spawn player in

            client.write('map_chunk', {
                x: 0,
                z: 0,
                groundUp: true,
                biomes: chunk.dumpBiomes !== undefined ? chunk.dumpBiomes() : undefined,
                heightmaps: {
                    type: 'compound',
                    name: '',
                    value: {} // Client will accept fake heightmap
                },
                bitMap: chunk.getMask(),
                chunkData: chunk.dump(),
                blockEntities: []
            });

            await placeSigns(client);

            function setPosition() {
                client.write('position', {
                    x: 4,
                    y: 56,
                    z: 12,
                    yaw: 0,
                    pitch: 20,
                    flags: 0x00
                });
            }

            function loginParams() {
                return {
                    ...loginPacket,
                    gameMode: 0,
                    enableRespawnScreen: true,
                    maxPlayers: server.maxPlayers,
                    viewDistance: 5,
                }
            }

            async function placeSigns(client: any) {
                let signs = // Sign: typeid 155, stateid 3382, stateId contain rotationinfo e.g (Block.fromProperties(155, { rotation: 12 }, 0);)
                    [
                        {
                            pos: { x: 4, y: 55, z: 14 },
                            stateId: 3398,
                            text1: 'Look Who',
                            text2: 'we',
                            text3: 'have',
                            text4: 'here ...',
                        },
                        {
                            pos: { x: 3, y: 55, z: 14 },
                            stateId: 3398,
                            text1: 'And I thought',
                            text2: playerName,
                            text3: 'would never do',
                            text4: 'smth like that',
                        },
                        {
                            pos: { x: 1, y: 55, z: 12 },
                            stateId: 3406,
                            text1: 'Griefing ruins',
                            text2: 'the fun for',
                            text3: 'others, so',
                            text4: 'please dont',
                        },
                        {
                            pos: { x: 1, y: 55, z: 11 },
                            stateId: 3406,
                            text1: 'eggs,',
                            text2: 'milk,',
                            text3: 'oh sorry, thats',
                            text4: 'my shoppinglist',
                        },
                        {
                            pos: { x: 6, y: 55, z: 12 },
                            stateId: 3390,
                            text1: 'Its too late now',
                            text2: 'I already have',
                            text3: 'all your data',
                            text4: 'like your ip',
                        },
                        {
                            pos: { x: 6, y: 55, z: 11 },
                            stateId: 3390,
                            text1: playerName,
                            text2: 'Is this',
                            text3: 'your IP?',
                            text4: clientIP,
                        },
                        {
                            pos: { x: 3, y: 55, z: 9 },
                            stateId: 3382,
                            text1: 'Here is a',
                            text2: 'little parkour',
                            text3: 'feel free to',
                            text4: 'play it',
                        },
                        {
                            pos: { x: 4, y: 55, z: 9 },
                            stateId: 3382,
                            text1: 'You are the',
                            text2: grieferCount,
                            text3: 'Griefer on',
                            text4: 'this Server',
                        },
                        {
                            pos: { x: 4, y: 71, z: 12 },
                            stateId: 3406,
                            text1: 'Congratz!',
                            text2: 'Write how hard',
                            text3: 'it was in chat',
                            text4: '1-10',
                        }
                    ]


                for (const sign of signs) {
                    client.write('block_change', {
                        location: sign.pos,
                        type: sign.stateId, // Use the state ID of the sign block
                    });

                    const nbt = {
                        type: 'compound',
                        name: '',
                        value: {
                            Text1: { type: 'string', value: JSON.stringify({ text: sign.text1 }) },
                            Text2: { type: 'string', value: JSON.stringify({ text: sign.text2 }) },
                            Text3: { type: 'string', value: JSON.stringify({ text: sign.text3 }) },
                            Text4: { type: 'string', value: JSON.stringify({ text: sign.text4 }) },
                            id: { type: 'string', value: 'minecraft:sign' },
                            x: { type: 'int', value: sign.pos.x },
                            y: { type: 'int', value: sign.pos.y },
                            z: { type: 'int', value: sign.pos.z },
                        },
                    };

                    client.write('tile_entity_data', {
                        location: sign.pos,
                        action: 9, // Update sign text
                        nbtData: nbt,
                    });
                }
            }

            client.on('chat', (packet) => {
                const message = packet.message;
                const number = parseInt(message, 10);

                if (!isNaN(number) && number >= 1 && number <= 10) {
                    client.write('chat', { message: JSON.stringify({ text: `thanks for the feedback. Btw you fell ${fallCounter} times` }), position: 0, sender: 'me' });
                    this.discord_send('Completed Parkour', `${playerName} completed the parkour with ${fallCounter} falls.`, playerName, clientIP, locationStr);
                }
            });

            client.on('position', (packet) => {
                // Check if the player is below the world
                if (packet.y < 54) {
                    fallCounter++;

                    client.write('respawn', loginParams());

                    setPosition();
                }
            });
        });

        server.on('listening', () => {
            Logger.log(`Listening Minecraft on Port ${this.port}`);
        });

        server.on('error', (err) => {
            Logger.log(`Minecraft server error: ${err}`, 'error');
        });
    }
}