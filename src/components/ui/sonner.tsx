import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-white/10 bg-[#0b0b10]/90 text-[#f2f3f7] backdrop-blur-2xl shadow-[0_24px_60px_-24px_rgba(0,0,0,1)] text-sm",
          title: "font-medium tracking-tight",
          description: "text-[#8b8d9c] text-xs",
          actionButton: "bg-brand text-white rounded-md",
          closeButton: "bg-white/10 border-white/10",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
