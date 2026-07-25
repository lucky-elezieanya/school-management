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
      <img
        src={image|| fallback}
        alt="Student"
        width={80}
        height={80}
        className="
          rounded-full
          object-cover
          w-[80px]
          h-[80px]
        "
      />

      <span
        className="
          mt-2
          text-[12px]
          font-semibold
         
          uppercase
          italic
        "
      >
        {gender}
      </span>
    </div>
  );
}
