/**
 * Example usage: `type ValidPaths = Paths<YourInterface>;`
 */
export type Paths<T, P extends string = ''> = T extends object
  ? {
      [K in keyof T]: T[K] extends string
        ? `${P & string}${K & string}`
        :
            | `${P & string}${K & string}`
            | Paths<T[K], `${P & string}${K & string}.`>;
    }[keyof T]
  : never;
