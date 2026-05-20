import SnowflakeId from 'snowflake-id';

const getMachineId = (): number => {
  const machineId = parseInt(process.env.SNOWFLAKE_MACHINE_ID || '1', 10);
  if (isNaN(machineId) || machineId < 0 || machineId > 1023) {
    throw new Error(`Invalid SNOWFLAKE_MACHINE_ID: must be 0-1023, got "${process.env.SNOWFLAKE_MACHINE_ID}"`);
  }
  return machineId;
};

const snowflake = new SnowflakeId({
  machineId: getMachineId(),
  epoch: 1577836800000, // 2020-01-01 00:00:00 UTC
});

/**
 * Generate a Snowflake ID as bigint.
 * 64-bit: 41-bit timestamp + 10-bit machineId + 12-bit sequence.
 * Set SNOWFLAKE_MACHINE_ID env var (0-1023) per server instance.
 */
export function generateSnowflakeId(): bigint {
  return BigInt(snowflake.generate());
}

export function generateSnowflakeIdString(): string {
  return snowflake.generate();
}
