const defaultAvatars = [
  "/avatar-fish.png",
  "/avatar-fox.png",
  "/avatar-giraffe.png",
  "/avatar-llama.png",
  "/avatar-panda.png",
  "/avatar-tiger.png",
  "/avatar-whale.png",
] as const;

export const DEFAULT_AVATARS: readonly string[] = defaultAvatars;

export default function chooseRandomDefaultAvatar(): string {
  const randomAvatar =
    defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
  return randomAvatar;
}
