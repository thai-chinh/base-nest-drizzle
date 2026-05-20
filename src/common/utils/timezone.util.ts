import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Timezone utility for handling company timezone conversions
 */
export class TimezoneUtil {
  /**
   * Convert UTC time to company timezone
   */
  static toCompanyTime(
    utcTime: Date,
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): dayjs.Dayjs {
    return dayjs(utcTime).tz(timezone);
  }

  /**
   * Convert company time to UTC
   */
  static toUTC(
    companyTime: Date | string,
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): Date {
    return dayjs.tz(companyTime, timezone).utc().toDate();
  }

  /**
   * Get current time in company timezone
   */
  static nowInCompanyTime(timezone: string = 'Asia/Ho_Chi_Minh'): dayjs.Dayjs {
    return dayjs().tz(timezone);
  }

  /**
   * Parse time string (HH:mm) to minutes in company timezone for a specific date
   */
  static parseTimeToMinutes(
    timeString: string,
    date: Date,
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    const companyDate = dayjs(date).tz(timezone);
    const timeInCompanyTz = companyDate.hour(hours).minute(minutes);

    return timeInCompanyTz.hour() * 60 + timeInCompanyTz.minute();
  }

  /**
   * Get current time in minutes for company timezone
   */
  static getCurrentTimeInMinutes(
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): number {
    const now = dayjs().tz(timezone);
    return now.hour() * 60 + now.minute();
  }

  /**
   * Create a date with specific time in company timezone
   */
  static createDateWithTime(
    date: Date,
    timeString: string,
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    return dayjs(date)
      .tz(timezone)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0)
      .toDate();
  }

  /**
   * Check if current time is within shift time range
   */
  static isWithinShiftTime(
    currentTime: Date,
    startTime: string,
    endTime: string,
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): boolean {
    const companyTime = dayjs(currentTime).tz(timezone);
    const currentMinutes = companyTime.hour() * 60 + companyTime.minute();

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * Calculate time difference in minutes between two times in company timezone
   */
  static getTimeDifferenceInMinutes(
    time1: Date,
    time2: Date,
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): number {
    const companyTime1 = dayjs(time1).tz(timezone);
    const companyTime2 = dayjs(time2).tz(timezone);

    const minutes1 = companyTime1.hour() * 60 + companyTime1.minute();
    const minutes2 = companyTime2.hour() * 60 + companyTime2.minute();

    return Math.abs(minutes1 - minutes2);
  }
}
