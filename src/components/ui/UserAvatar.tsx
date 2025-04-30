import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  className?: string;
}

export const UserAvatar = ({ name, className }: UserAvatarProps) => {
  // Get initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={className}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};
