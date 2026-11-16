// sessionStorage an toàn: trình duyệt chặn storage thì vẫn chạy, chỉ là không nhớ được (spec mục 4.1).
export const safeSession = {
  get(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* bỏ qua */
    }
  },
};

export const safeLocal = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* bỏ qua */
    }
  },
};
