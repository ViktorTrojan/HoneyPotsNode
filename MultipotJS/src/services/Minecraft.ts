import Logger from "@/util/Logger.js";
import { Service } from "./Service.js";
import * as fs from 'fs';

import MinecraftData from "minecraft-data";
import minecraftProtocol from 'minecraft-protocol';
import prismarineChunkLoader, { PCChunk } from 'prismarine-chunk';
import AnvilProvider from 'prismarine-provider-anvil';
import PrismarineWorld from 'prismarine-world';
import PrismarineRegistry from 'prismarine-registry';
import { Vec3 } from "vec3";
import { Schematic } from 'prismarine-schematic'
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Block } from "prismarine-block"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Minecraft extends Service {
    constructor({ enabled = false, reportip = false, discord_webhook }) {
        super({ service_name: 'minecraft', port: 25565, enabled, reportip, discord_webhook });
    }

    generateSimpleChunk(chunkX, chunkZ) {
        const Chunk = prismarineChunkLoader('1.16');
        const chunk = new Chunk()

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                chunk.setBlockType(new Vec3(x, 50, z), 1)
                for (let y = 0; y < 256; y++) {
                    chunk.setSkyLight(new Vec3(x, y, z), 15)
                }
            }
        }

        return chunk
    }

    async start() {
        // Create a simple Minecraft server
        const server = minecraftProtocol.createServer({
            'online-mode': false,
            port: 25565, // optional
            version: '1.16',
        });

        const registry = PrismarineRegistry('1.16');
        const mcData = MinecraftData('1.16') // server.version
        const loginPacket = mcData.loginPacket

        const Chunk = prismarineChunkLoader('1.16');
        const chunk: PCChunk = new Chunk()
        chunk.load(await fs.readFileSync(__dirname + '/../../other/chunk.dump'), 25, true);



        server.on('login', async (client) => {

            // Send the chunk to the client
            client.write('login', {
                ...loginPacket,
                gameMode: 1,
                enableRespawnScreen: true,
                maxPlayers: server.maxPlayers,
                viewDistance: 5,
                // entityId: client.id,
                // levelType: 'default',
                // previousGameMode: 255,
                // worldNames: ['minecraft:overworld'],
                // dimensionCodec: loginPacket.dimensionCodec,
                // dimension: 'minecraft:overworld',
                // worldName: 'minecraft:overworld',
                // hashedSeed: [0, 0],
                // reducedDebugInfo: false,
                // isDebug: false,
                // isFlat: false
            });

            client.write('position', {
                x: 4,
                y: 56,
                z: 12,
                yaw: 0,
                pitch: 20,
                flags: 0x00
            });

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

            // Place and update a sign with "Hello World"
            await placeSign(client, 3, 55, 9, 'Hello', 'World');

            async function placeSign(client: any, x: number, y: number, z: number, text1: string, text2: string, text3: string = '', text4: string = '') {
                const signBlock = chunk.getBlock(new Vec3(3, 55, 9)); // GET SIGN BLOCK
                //signBlock.setSignText('test');

                client.write('block_change', {
                    location: { x, y, z },
                    type: signBlock.stateId, // Use the state ID of the sign block
                });

                const nbt = {
                    type: 'compound',
                    name: '',
                    value: {
                        Text1: { type: 'string', value: JSON.stringify({ text: 'UWU' }) },
                        Text2: { type: 'string', value: JSON.stringify({ text: '' }) },
                        Text3: { type: 'string', value: JSON.stringify({ text: '' }) },
                        Text4: { type: 'string', value: JSON.stringify({ text: '' }) },
                        id: { type: 'string', value: 'minecraft:sign' },
                        x: { type: 'int', value: x },
                        y: { type: 'int', value: y },
                        z: { type: 'int', value: z },
                    },
                };

                client.write('tile_entity_data', {
                    location: { x, y, z },
                    action: 9, // Update sign text
                    nbtData: nbt,
                });

                // client.write('tile_entity_data', {
                //     location: { x, y, z },
                //     action: 9, // Update sign text
                //     nbtData: signBlock.entity,
                // });
            }

            // // Place sign with "Hello World"
            // const signX = 3;
            // const signY = 55;
            // const signZ = 9;

            // client.write('block_change', {
            //     location: { x: signX, y: signY, z: signZ },
            //     type: 3381 // Block ID for a sign (63 for standing sign in older versions)
            // });

            // client.write('update_sign', {
            //     location: { x: signX, y: signY, z: signZ },
            //     text1: 'Hello',
            //     text2: 'World',
            //     text3: '',
            //     text4: ''
            // });
        });



        server.on('listening', () => {
            Logger.log(`Listening Minecraft on Port ${this.port}`);
        });

        server.on('error', (err) => {
            Logger.log(`Minecraft server error: ${err}`, 'error');
        });
    }
}