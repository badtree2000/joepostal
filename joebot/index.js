const Discord = require('discord.js');
const client = new Discord.Client({partials: ["MESSAGE", "USER", "REACTION"]});
const enmap = require('enmap');
const {token, prefix} = require('./config.json')

const settings = new enmap({
    name: "settings",
    autoFetch: true,
    cloneLevel: "deep",
    fetchAll: true
});

client.on('ready', () => {
    console.log('ready')
});

client.on('message', async message => {
    if(message.author.bot) return;
    if(message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command == "order-setup") {
        // order-setup #channel

        let channel = message.mentions.channels.first();

        if(!channel) return message.reply("Usage: `!order-setup #channel`");

        let sent = await channel.send(new Discord.MessageEmbed()
            .setTitle("Order System")
            .setDescription("React to Process Your Order!")
            .setFooter("Order System")
            .setColor("00ff00")
        );

        sent.react('🛒');
        settings.set(`${message.guild.id}-order`, sent.id);

        message.channel.send("Order is Ready to go!")
    }

    if(command == "close") {
        if(!message.channel.name.includes("order-")) return message.channel.send("You cannot use that here!")
        message.channel.delete();
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if(user.partial) await user.fetch();
    if(reaction.partial) await reaction.fetch();
    if(reaction.message.partial) await reaction.message.fetch();

    if(user.bot) return;

    let orderid = await settings.get(`${reaction.message.guild.id}-order`)

    if(!orderid) return;

    if(reaction.message.id == orderid && reaction.emoji.name == '🛒') {
        reaction.users.remove(user);

        reaction.message.guild.channels.create(`order-${user.username}`, {
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
                },
                {
                    id: reaction.message.guild.roles.everyone,
                    deny: ["VIEW_CHANNEL"]
                }
            ],
            type: 'text', parent: '858593555051315210'
        }).then(async channel => {
            channel.send(`<@${user.id}>`, new Discord.MessageEmbed().setTitle("Joe's Postal at your Service!").setDescription("Please stat your name, DOB, What you would like and We will take your order shortly!").setColor("00ff00"))
        })
    }
});

module.exports = {
    name: 'order',
    aliases: [],
    permissions: [],
    description: 'Start your Order!',
    async execute(message, args, cmd, client, discord){
        const channel = await message.guild.channels.create(`orders: ${message.author.tag}`);
        channel.setParent('858593555051315210')

        channel.updateOverwrite(message.guild.id, {
            SEND_MESSAGE: false,
            VIEW_CHANNEL: false,
        })
        channel.updateOverwrite(message.author, {
            SEND_MESSAGE: true,
            VIEW_MESSAGE: true,
        });

        const reactionMessage = await channel.send("Thankyou for Ordering at Joe's Postal!");

        try{
            
            await reactionMessage.react("🔒");
            await reactionMessage.react("⛔");
        }catch(err) {
            channel.send('Error sending emojis!');
            throw err;
        }
       
        const collect = reactionMessage.createReactionCollector((reaction, user) => 
            message.guild.members.cache.find((member) => member.id === user.id).hasPermission('ADMINISTRATOR'),
            { dispose: true }
        );

        collector.on('collect', (reaction, user) => {
            switch (reaction.emoji.name){
                case "🔒":
                    channel.updateOverwrite(message.author, { SEND_MESSAGES: false});
                    break;
                case "⛔":
                    channel.send('Channel Has Been Compromised, Blowing up in 5 Seconds!');
                    setTimeout(() => channel.delete(), 5000);
                    break;
            }
        });

        message.channel.send(`Joe's Postal will be right with you! ${channel}`).then((msg) => {
            setTimeout(() => msg.delete(), 7000)
            setTimeout(() => message.delete(), 3000); 
        }).catch((err) => {
            throw err;
        });
    },
};

client.login(token);