import { randomItem } from './randomItem';

let callNumber = 0;
export function randomParticipantName(): string {
  const names = ['Alice', 'Bob', 'Charlie', 'Delta', 'Echo', 'FoxTrot', 'Golf', 'Hotel', 'India',
    'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra',
    'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu'];

    let pick = names[callNumber];
    callNumber = (callNumber+1) % 26;
    return pick;
}

export function randomName() {
  var ADJECTIVES = [
    'Abrasive', 'Brash', 'Callous', 'Daft', 'Eccentric', 'Finest', 'Golden',
    'Holy', 'Ignominious', 'Jolted', 'Killer', 'Luscious', 'Mushy', 'Nasty',
    'OldSchool', 'Pompous', 'Quiet', 'Rowdy', 'Sneaky', 'Tawdry',
    'Unique', 'Vivacious', 'Wicked', 'Xenophobic', 'Yawning', 'Zesty'
  ];

  var FIRST_NAMES = [
    'Anna', 'Bobby', 'Cameron', 'Danny', 'Emmett', 'Frida', 'Gracie', 'Hannah',
    'Isaac', 'Jenna', 'Kendra', 'Landon', 'Mufasa', 'Nate', 'Owen', 'Penny',
    'Quincy', 'Ruddy', 'Samantha', 'Tammy', 'Ulysses', 'Victoria', 'Wendy',
    'Xander', 'Yolanda', 'Zelda'
  ];

  var LAST_NAMES = [
    'Anchorage', 'Berlin', 'Cucamonga', 'Davenport', 'Essex', 'Fresno',
    'Gunsight', 'Hanover', 'Indianapolis', 'Jamestown', 'Kane', 'Liberty',
    'Minneapolis', 'Nevis', 'Oakland', 'Portland', 'Quantico', 'Raleigh',
    'SaintPaul', 'Tulsa', 'Utica', 'Vail', 'Warsaw', 'XiaoJin', 'Yale',
    'Zimmerman'
  ];
  return randomItem(ADJECTIVES) +
    randomItem(FIRST_NAMES) +
    randomItem(LAST_NAMES);
}

export function randomRoomName() {
  var PLACES = [
    'Agra', 'Berlin', 'Cucamonga', 'Davenport', 'Essex', 'Fresno',
    'Gunsight', 'Hanover', 'Indore', 'Jamestown', 'Kalwa', 'Liberty',
    'Madras', 'Nevis', 'Oakland', 'Portland', 'Quantico', 'Redmond',
    'Seattle', 'Thane', 'Utica', 'Vail', 'Warsaw', 'XiaoJin', 'Yale',
    'Zimmerman'
  ];

  var COUNTRIES = [
    'Austria', 'Brazil', 'China', 'Denmark', 'Egypt', 'France',
    'Ghana', 'Holland', 'India', 'Jamaica', 'Kenya', 'Libya',
    'Mexico', 'Nepal', 'Oman', 'Peru', 'Qatar', 'Russia',
    'Spain', 'Turkey', 'Uganda', 'Vietnam', 'Wales', 'Xianbei', 'Yemen',
    'Zambia'
  ];


  return randomItem(PLACES) +
    randomItem(COUNTRIES);
}
