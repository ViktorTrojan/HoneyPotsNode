import Logger from "@/util/Logger.js";
import { Service } from "./Service.js";

import MinecraftData from "minecraft-data";
import minecraftProtocol from 'minecraft-protocol';
import prismarineChunkLoader from 'prismarine-chunk';
import AnvilProvider from 'prismarine-provider-anvil';
import { Vec3 } from "vec3";
export class Minecraft extends Service {
    constructor({ enabled = false, reportip = false, discord_webhook }) {
        super({ service_name: 'minecraft', port: 25565, enabled, reportip, discord_webhook });
    }

    async start() {
        const server: any = minecraftProtocol.createServer({
            motd: 'CraftAttack SMP Server',
            'online-mode': true,
            port: this.port,
            keepAlive: true,
            version: '1.16',
        });

        const mcData = MinecraftData(server.version)
        const loginPacket = mcData.loginPacket

        const Anvil = AnvilProvider.Anvil('1.16');
        const anvil = new Anvil('C:\\Users\\Anix\\AppData\\Roaming\\.minecraft\\saves\\Nothing\\region')

        const d = anvil.load(0, 0);

        // Create a new ChunkColumn instance
        const Chunk = prismarineChunkLoader('1.16');
        let chunk = new Chunk({
            minY: 1,
            worldHeight: 128
        })

        d.then(function (data) { // data of type chunk
            chunk.load(data.dump());
            chunk.loadBiomes(data.dumpBiomes());

            for (let x = 0; x < 16; x++) {
                for (let z = 0; z < 16; z++) {
                    for (let y = 0; y < 30; y++) {
                        // block.name
                        chunk.setBlockType(new Vec3(x, y, z), mcData.blocksByName.grass_block.id)
                        chunk.setBlockData(new Vec3(x, y, z), 1)
                    }
                }
            }
        }).catch(function (err) { console.log(err.stack) })

        server.on('playerJoin', function (client) {
            client.write('login', {
                ...loginPacket,
                gameMode: 1,
                maxPlayers: 3,
                viewDistance: 4,
                enableRespawnScreen: true,
            })
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
            })
            client.write('position', {
                x: 7,
                y: 30,
                z: 7,
                yaw: 137,
                pitch: 0,
                flags: 0x00
            })
        })

        server.on('listening', () => {
            Logger.log(`Listening Minecraft on Port ${this.port}`);
        });

        server.on('error', (err) => {
            Logger.log(`Minecraft server error: ${err}`, 'error');
        });
    }
}