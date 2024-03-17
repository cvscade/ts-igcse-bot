import { PrivateDmThread, type IPrivateDmThread } from "@/mongo";
import { GuildPreferencesCache } from "@/redis";
import { GuildMember, MessagePayload, TextChannel, ChannelType, type MessageCreateOptions, ThreadChannel } from "discord.js";
import Logger from "./Logger";

export default class DM {
    public static async send(member: GuildMember, message: string | MessagePayload | MessageCreateOptions): Promise<void> {
        try {
            await member.send(message);
        } catch (error) {
            const guildPreferences = await GuildPreferencesCache.get(member.guild.id);
            if (!guildPreferences) return;

            const channel = member.guild.channels.cache.get(guildPreferences.closedDmChannelId);
            if (!channel || !(channel instanceof TextChannel)) return;

            let thread: ThreadChannel | undefined;

            let dmThread = await PrivateDmThread.findOne({ userId: member.id, guildId: member.guild.id }) ?? null
            if (!dmThread) {
                const newThread = await channel.threads.create({
                    name: `${member.user.username} (${member.id})`,
                    type: ChannelType.PrivateThread,
                })

                await newThread.members.add(member, "User has DMs closed")
                    .catch(() => {}); // user has blocked the bot
                
                thread = newThread;

                await PrivateDmThread.create({
                    userId: member.id,
                    threadId: newThread.id,
                    guildId: member.guild.id
                });
            } else {
                thread = channel.threads.cache.get(dmThread.threadId);
            }

            if (!thread) {
                Logger.error(`Thread not found for user ${member.id} in guild ${member.guild.id}`);
                return
            }

            await thread.send(`<@${member.id}>`)
            await thread.send(message);
        }
    }
}