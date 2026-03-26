import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    uid: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .collect();

    if (existingUsers.length > 0) {
      await ctx.db.patch(existingUsers[0]._id, {
        email: args.email,
        name: args.name,
        picture: args.picture,
      });
    } else {
      await ctx.db.insert("users", {
        uid: args.uid,
        email: args.email,
        name: args.name,
        picture: args.picture,
      });
    }
  },
});
