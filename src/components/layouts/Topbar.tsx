interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <div className="font-condensed text-[17px] font-bold text-gray-900 tracking-[0.02em] leading-none">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-gray-400 mt-[3px]">{subtitle}</div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}