import { useEffect, useState } from "react";

interface ResponsiveValues {
  mobile?: number | string;
  tablet?: number | string;
  desktop?: number | string;
}

export function useResponsiveValue(values: ResponsiveValues) {
  const [value, setValue] = useState<number | string>();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setValue(values.mobile ?? values.tablet ?? values.desktop);
      } else if (width < 1024) {
        setValue(values.tablet ?? values.desktop);
      } else {
        setValue(values.desktop);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [values.mobile, values.tablet, values.desktop]);

  return value;
}
