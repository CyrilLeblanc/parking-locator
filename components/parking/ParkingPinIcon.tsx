type Props = {
  bubbleBg?: string;
  bubbleText?: string;
  bubbleFontSize?: string;
  pinColor?: string;
};

export function ParkingPinIcon({ bubbleBg, bubbleText, bubbleFontSize, pinColor = "#1565c0" }: Props) {
  const showBubble = bubbleText !== undefined && bubbleBg !== undefined;
  return (
    <div style={{ position: "relative", width: showBubble ? 36 : 28, height: showBubble ? 44 : 36 }}>
      <svg
        style={{ position: "absolute", left: 0, bottom: 0, zIndex: 0 }}
        width={28}
        height={36}
        viewBox="0 0 28 36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 2 C7.37 2 2 7.37 2 14 C2 22.5 14 34 14 34 C14 34 26 22.5 26 14 C26 7.37 20.63 2 14 2 Z"
          fill={pinColor}
        />
        <text
          x={14}
          y={19}
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight={700}
          fontSize={14}
          fill="white"
        >
          P
        </text>
      </svg>
      {showBubble && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: bubbleBg,
            border: "1.5px solid white",
            color: "white",
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            fontSize: bubbleFontSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
            zIndex: 1,
          }}
        >
          {bubbleText}
        </div>
      )}
    </div>
  );
}
