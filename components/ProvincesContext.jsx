'use client';

// Danh mục tỉnh/thành (layout đã tải sẵn cho header) chia sẻ cho ô tìm — gợi ý nhóm «Tỉnh/thành» không
// phải gọi API thêm.
import { createContext, useContext } from 'react';

const ProvincesContext = createContext([]);

export function ProvincesProvider({ provinces, children }) {
  return <ProvincesContext.Provider value={provinces}>{children}</ProvincesContext.Provider>;
}

export const useProvinces = () => useContext(ProvincesContext);
