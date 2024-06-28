import { status } from 'minecraft-server-util';

const host = 'localhost'; // Replace with your Minecraft server address
const port = 25565; // Replace with your Minecraft server port, default is 25565

async function getServerStatus() {
    try {
        const result = await status(host, port);

        console.log('Server Status:');
        console.log(`MOTD: ${result.motd.clean}`);
        console.log(`Version: ${result.version.name}`);
        console.log(`Protocol Version: ${result.version.protocol}`);
        console.log(`Max Players: ${result.players.max}`);
        console.log(`Players Online: ${result.players.online}`);
        console.log('Player List:');

        if (result.players.sample) {
            result.players.sample.forEach(player => {
                console.log(`- ${player.name}`);
            });
        } else {
            console.log('No players online.');
        }
    } catch (error) {
        console.error('Error fetching server status:', error);
    }
}

getServerStatus();
