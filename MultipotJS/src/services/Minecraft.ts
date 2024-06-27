import Logger from "@/util/Logger.js";

import minecraftProtocol from 'minecraft-protocol';
import { Service } from "./Service.js";
import MinecraftData from "minecraft-data";
import { Vec3 } from "vec3";
import * as fs from 'fs';

import prismarineRegistry from 'prismarine-registry';
import prismarineChunkLoader from 'prismarine-chunk';
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class Minecraft extends Service {
    constructor({ enabled = false, reportip = false, discord_webhook }) {
        super({ service_name: 'minecraft', port: 25565, enabled, reportip, discord_webhook });
    }

    async start() {
        const server: any = minecraftProtocol.createServer({
            'online-mode': true,
            port: this.port,
            keepAlive: true,
            version: '1.16',
        });

        const mcData = MinecraftData(server.version)
        const loginPacket = mcData.loginPacket

        // Initialize registry for Minecraft version 1.8
        const registry = prismarineRegistry('1.16');

        // Create a new ChunkColumn instance
        const ChunkColumn = prismarineChunkLoader(registry);
        const chunk = new ChunkColumn();

        const buffer = fs.readFileSync(__dirname + "/../../other/chunk.dump")

        // chunk.load(buffer)

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                chunk.setBlockType(new Vec3(x, 100, z), mcData.blocksByName.grass_block.id)
                chunk.setBlockData(new Vec3(x, 100, z), 1)
                for (let y = 0; y < 256; y++) {
                    chunk.setSkyLight(new Vec3(x, y, z), 15)
                }
            }
        }

        // console.log(chunk.dump())

        server.on('playerJoin', function (client) {
            client.write('login', {
                ...loginPacket,
                entityId: client.id,
                isHardcore: false,
                gameMode: 0,
                previousGameMode: 1,
                worldName: 'minecraft:overworld',
                hashedSeed: [0, 0],
                maxPlayers: server.maxPlayers,
                viewDistance: 10,
                reducedDebugInfo: false,
                enableRespawnScreen: true,
                isDebug: false,
                isFlat: false
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
                x: 15,
                y: 101,
                z: 15,
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