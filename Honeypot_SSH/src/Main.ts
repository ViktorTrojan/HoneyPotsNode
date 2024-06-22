import Config from '@/Config.js';
import Logger from '@/util/Logger.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import geoip from 'geoip-lite';
import ssh2 from 'ssh2';
import { DB } from './db/DB.js';
import { executed_commands, login_attempts } from './db/Schema.js';

// SSH server configuration
const config = {
    hostKeys: [fs.readFileSync('host.key')]
};

const commandResponses = [
    {
        command: "cpuinfo",
        response: "32"
    },
    {
        command: "etc_passwd",
        response: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin"
    },
    {
        command: "ls",
        response: "file1.txt  file2.txt  server_files"
    },
    {
        command: "ps",
        response: "  PID TTY          TIME CMD\n 1234 pts/0    00:00:00 bash\n 5678 pts/0    00:00:00 ps"
    },
    {
        command: "whoami",
        response: "admin"
    },
    {
        command: "id",
        response: "uid=1000(admin) gid=1000(admin) groups=1000(admin),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),116(lxd)"
    },
    {
        command: "uname -a",
        response: "Linux Arch 4.15.0-54-generic #58-Ubuntu SMP Mon Jun 24 10:55:24 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux"
    },
    {
        command: "netstat -an | grep LISTEN",
        response: "tcp        0      0 0.0.0.0:22            0.0.0.0:*               LISTEN\nudp        0      0 0.0.0.0:123           0.0.0.0:*"
    },
    {
        command: "cat /etc/passwd",
        response: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n"
            + "user:x:1000:1000:user:/home/user:/bin/bash\n"
            + "guest:x:1001:1001:guest:/home/guest:/bin/sh"
    },
    {
        command: "cat /etc/shadow",
        response: "root:$6$C2M7ICxa$M6c3y2YhGt4wO1wT9VXnLxPIm58uF6n4iqvHd5PdLO2zH7l5UePSyJ4JNcXbXg2nNRk2y/Jj6/vW7S3oiEwlC/:18763:0:99999:7:::\n"
            + "user:$6$Tr2l0xTn$oUsIiJvRlBRbqJnW53VgjRLZrcN/L6JqQPh0u3zLf9n4d9R61r3aA0W8Q4EhG1H7UGrOc3T1G3gVXQle11cb/:18763:0:99999:7:::"
    },
    {
        command: "df -h",
        response: "Filesystem      Size  Used Avail Use% Mounted on\n"
            + "/dev/sda1       20G   8G   10G   45% /\n"
            + "tmpfs           2.0G  0    2.0G  0% /dev/shm\n"
            + "/dev/sdb1       50G   12G  35G   25% /data"
    },
    {
        command: "uptime",
        response: " 15:37:57 up 1 day,  2:45,  2 users,  load average: 0.08, 0.11, 0.09"
    },
    {
        command: "top",
        response: "top - 15:38:12 up 1 day,  2:45,  2 users,  load average: 0.08, 0.11, 0.09\nTasks: 175 total,   1 running, 174 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  3.2 us,  0.6 sy,  0.0 ni, 96.2 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :   2000.3 total,    300.5 free,   1400.6 used,    299.3 buff/cache\nMiB Swap:      0.0 total,      0.0 free,      0.0 used.    148.3 avail Mem"
    },
    {
        command: "w",
        response: " 15:38:31 up 1 day,  2:45,  2 users,  load average: 0.08, 0.11, 0.09\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nadmin    pts/0    192.168.1.100    14:12    2:25   0.01s  0.01s -bash\nuser     pts/1    192.168.1.101    15:30    0.00s  0.02s  0.00s w"
    },
    {
        command: "history",
        response: "    1  ls\n    2  ps\n    3  whoami\n    4  id\n    5  uname -a\n    6  netstat -an | grep LISTEN\n    7  cat /etc/passwd\n    8  cat /etc/shadow\n    9  df -h\n   10  uptime\n   11  top\n   12  w\n   13  history"
    },
    {
        command: "ifconfig",
        response: "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\n        inet6 fe80::a00:27ff:fe70:9c37  prefixlen 64  scopeid 0x20<link>\n        ether 08:00:27:70:9c:37  txqueuelen 1000  (Ethernet)\n        RX packets 486006  bytes 323516411 (308.4 MiB)\n        RX errors 0  dropped 0  overruns 0  frame 0\n        TX packets 145909  bytes 13593674 (12.9 MiB)\n        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        loop  txqueuelen 1000  (Local Loopback)\n        RX packets 20278  bytes 1584668 (1.5 MiB)\n        RX errors 0  dropped 0  overruns 0  frame 0\n        TX packets 20278  bytes 1584668 (1.5 MiB)\n        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0"
    },
    {
        command: "ip addr show",
        response: "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n       valid_lft forever preferred_lft forever\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000\n    link/ether 08:00:27:70:9c:37 brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0\n       valid_lft forever preferred_lft forever"
    },
    {
        command: "route -n",
        response: "Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         192.168.1.1     0.0.0.0         UG    0      0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 eth0"
    },
    {
        command: "last",
        response: "admin    pts/0        192.168.1.100    Mon Jun 24 14:12   still logged in\nuser     pts/1        192.168.1.101    Mon Jun 24 15:30 - 15:38  (00:07)"
    },
    {
        command: "uname -r",
        response: "4.15.0-54-generic"
    },
    {
        command: "find / -type f -name '*.log'",
        response: "/var/log/syslog\n/var/log/auth.log\n/var/log/apache2/error.log"
    },
    {
        command: "du -sh *",
        response: "4.0K    file1.txt\n8.0K    file2.txt\n32K     secret_folder"
    },
    {
        command: "lsblk",
        response: "NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT\nsda      8:0    0   20G  0 disk \n├─sda1   8:1    0   15G  0 part /\n└─sda2   8:2    0    5G  0 part [SWAP]\nsdb      8:16   0   50G  0 disk /data"
    },
];

function sendDiscordMsg(webhookUrl: string, username: string, password: string, ip: string, location: string): void {
    try {
        let color = 4145305; // blue
        let symbol = "🔵";

        const embed: any = {
            title: `${symbol} Login Attempt`,
            color: color,
            fields: []
        };
        embed.fields.push({ name: "Username", value: username });
        embed.fields.push({ name: "Password", value: password });
        embed.fields.push({ name: "IP", value: ip });
        embed.fields.push({ name: "Location", value: location });
        const jsonPayload = { embeds: [embed] };

        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(jsonPayload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => { })
            .catch(error => {
                Logger.log(`Error sending message: ${error}`, 'error');
            });

    } catch (error) { }
}

// Create SSH server
const server = new ssh2.Server(config, (client: any) => {
    let clientIP = (client as any)._sock.remoteAddress;

    Logger.log(`Client ${clientIP} trying to establish connection!`);
    client.on('authentication', async (ctx) => {
        if (ctx.method === 'password') {
            const { username, password } = ctx;
            let location = geoip.lookup(clientIP);
            let locationStr = location ? `Country [${location.country}] City [${location.city}] Area [${location.area}]` : 'Unknown';

            Logger.log(`Login attempt [${clientIP}] [${username}] [${password}]`);
            sendDiscordMsg(Config.discord.DISCORD_WEBHOOK, username, password, clientIP, locationStr);

            await DB.insert(login_attempts).values({ username, password, ip: clientIP, location: locationStr });

            if (Math.random() < Config.app.RANDOM_LOGIN_CHANCE) {
                Logger.log(`[${clientIP}] [${username}] [${password}] - ACCEPTED`);
                ctx.accept(); // allow login
            } else {
                ctx.reject();
            }

        } else ctx.reject();
    });

    client.on('ready', () => {
        Logger.log(`[${clientIP}] authenticated`);

        client.on('session', (accept, reject) => {
            const session = accept();

            session.on('pty', (accept, reject, info) => { // requested pseudo terminal, normal ssh client software behavior 
                accept();
            });

            // session.on('shell', (accept, reject, info) => {
            //     let stream = accept();
            //     stream.on('data', async (data: Buffer) => {
            //         let command = data.toString().trim();
            //         await DB.insert(executed_commands).values({ command, fk_login: sql`(SELECT MAX(id) FROM login_attempts)` });
            //         stream.write(data);
            //     });
            // });

            session.on('exec', async (accept, reject, info) => {
                const stream = accept();
                const command: string = info.command.trim().toLowerCase();
                if (command == "") return;
                await DB.insert(executed_commands).values({ command, fk_login: sql`(SELECT MAX(id) FROM login_attempts)` });

                // Find the command in commandResponses array
                const commandResponse = commandResponses.find(cmd => cmd.command === command);

                if (commandResponse) {
                    stream.write(`${commandResponse.response}\n`);
                } else {
                    stream.write(`unknown\n`);
                }
            });
        });
    });

    client.on('end', () => { Logger.log(`[${clientIP}] - Disconnected`); });
    client.on('close', () => { Logger.log(`[${clientIP}] - Connection closed`); });
    client.on('error', (err) => { Logger.log(`Client error: ${err}`, 'error'); });
});

server.listen(Config.app.PORT, '0.0.0.0', () => { // Start SSH server
    Logger.log(`Listening on port ${Config.app.PORT}`);
});