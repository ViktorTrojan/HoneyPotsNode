import Logger from "@/util/Logger.js";
import { Service } from "./Service.js";
import * as fs from 'fs';

import MinecraftData from "minecraft-data";
import minecraftProtocol from 'minecraft-protocol';
import prismarineChunkLoader from 'prismarine-chunk';
import AnvilProvider from 'prismarine-provider-anvil';
import PrismarineWorld from 'prismarine-world';
import { Vec3 } from "vec3";
import { Schematic } from 'prismarine-schematic'
import { fileURLToPath } from "url";
import { dirname } from "path";

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
            'online-mode': true,
            port: 25565, // optional
            version: '1.16',
        });

        const mcData = MinecraftData(server.version)
        const loginPacket = mcData.loginPacket

        // const Anvil = AnvilProvider.Anvil('1.16');
        // const World = PrismarineWorld('1.16');
        // const anvil = new Anvil('C:\\Users\\Anix\\AppData\\Roaming\\.minecraft\\saves\\prismarine\\N\\region');
        // const world = new World(this.generateSimpleChunk, anvil);
        const x = 0; // Chunk coordinates
        const z = 0;

        const Chunk = prismarineChunkLoader('1.16');
        const chunk = new Chunk()
        // let chunk2 = await world.getColumn(x, z);

        // chunk.load(chunk2.dump(), 25, true);
        chunk.load(await fs.readFileSync(__dirname + '/../../other/chunk.dump'), 25, true);
        // const out = chunk.dump();
        // console.log(chunk2.getMask())
        // fs.writeFileSync(__dirname + '/../../other/chunk.mask', out);

        // const schematic = await Schematic.read(await fs.readFileSync(__dirname + '/../../other/grief.schem'))
        // // schematic.forEach((block, pos) => {
        // //     if(block.name != 'air') {
        // //         console.log(block)
        // //         // chunk.setBlockType(new Vec3(pos.x+23, pos.y+30, pos.z+24), block.type)
        // //         chunk.setBlockType(new Vec3(pos.x+15, pos.y+20, pos.z+16), block.type)
        // //     }
        // // });
        // schematic.paste(world, new Vec3(15, 70, 0));
        // schematic.paste(world, new Vec3(1, 1, 1));



        server.on('login', async (client) => {

            // Send the chunk to the client
            client.write('login', {
                entityId: client.id,
                levelType: 'default',
                gameMode: 1,
                previousGameMode: 255,
                worldNames: ['minecraft:overworld'],
                dimensionCodec: loginPacket.dimensionCodec,
                dimension: 'minecraft:overworld',
                worldName: 'minecraft:overworld',
                hashedSeed: [0, 0],
                maxPlayers: server.maxPlayers,
                viewDistance: 10,
                reducedDebugInfo: false,
                enableRespawnScreen: true,
                isDebug: false,
                isFlat: false
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
        });

        server.on('listening', () => {
            Logger.log(`Listening Minecraft on Port ${this.port}`);
        });

        server.on('error', (err) => {
            Logger.log(`Minecraft server error: ${err}`, 'error');
        });
    }
}