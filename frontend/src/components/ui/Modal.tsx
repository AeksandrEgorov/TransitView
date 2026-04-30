import type { ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  padded?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-[1180px]",
  full: "max-w-[96vw]",
};

function Modal({ isOpen, onClose, children, size = "md", padded = true }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={`w-full ${sizeClasses[size]} max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl ${
          padded ? "p-6 sm:p-7" : ""
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;