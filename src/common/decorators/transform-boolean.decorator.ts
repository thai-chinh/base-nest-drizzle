import { Transform } from 'class-transformer';

export const TransformBoolean = () =>
  Transform(({ value }) => {
    console.log('🚀 ~ TransformBoolean ~ value:', value);

    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });
