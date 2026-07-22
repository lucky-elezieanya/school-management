import Image from "next/image";

interface HeaderProps {
  image?: string;
}

export default function Header({ image }: HeaderProps) {
  return (
    <div
      className="
                flex
                justify-center
                border-[0.5px]
                border-gray-400
                rounded-md
                mb-[2px]
                bg-white
            "
    >
      <Image
        src={image || "/cozzi-header.png"}
        alt="School Header"
        width={1000}
        height={160}
        priority
        className="
                    w-[80%]
                    h-auto
                    object-contain
                "
      />
    </div>
  );
}
