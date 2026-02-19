declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
            language_code?: string;
            is_premium?: boolean;
          };
        };
        ready: () => void;
        close: () => void;
        expand: () => void;
      };
    };
  }
}

export {};
