import Image from "next/image";

interface Props {
  image?: string;
  gender: string;
  fallback: string;
}

export default function StudentPhoto({ image, gender, fallback }: Props) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        mx-auto
        w-[90px]
      "
    >
      <Image
        src={image || fallback}
        alt="Student"
        width={70}
        height={80}
        className="
          rounded
          object-cover
          w-[70px]
          h-[80px]
        "
      />

      <span
        className="
          mt-1
          text-[10px]
          font-semibold
        "
      >
        {gender}
      </span>
    </div>
  );
}
