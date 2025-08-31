"use client";
import Image from "next/image";

type Props = {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  sns?: { label: string; url: string }[];
};

export default function AuthorBox({
  name,
  title,
  bio,
  avatarUrl,
  sns = [],
}: Props) {
  return (
    <aside className="mt-10 rounded-2xl border p-5 shadow-sm bg-white/70">
      <div className="flex items-center gap-4">
        <Image
          src={avatarUrl}
          alt={name}
          width={64}
          height={64}
          className="rounded-full"
        />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6">{bio}</p>
      {sns.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3 text-sm text-blue-700">
          {sns.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="nofollow noopener">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
