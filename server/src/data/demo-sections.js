// Zachary Allarey Code Section
// sample section times for the weekly schedule
// used when the database doesn't have real meeting times yet
// these are made up for the demo, not real one.uf sections

const mwf = (period, building, room) => ({
  days: ['M', 'W', 'F'], periodBegin: period, periodEnd: period, building, room,
})
const tr = (begin, end, building, room) => ({
  days: ['T', 'R'], periodBegin: begin, periodEnd: end, building, room,
})

const section = (classNumber, sectionNumber, meetTimes, credits = 3) => ({
  classNumber, sectionNumber, instructors: ['Staff'], credits, openSeats: null, meetTimes,
})

export const DEMO_SECTIONS = {
  'phy-2048': [
    section(10101, '1A01', [mwf('3', 'NPB', '1001')], 3),
    section(10102, '1A02', [mwf('6', 'NPB', '1001')], 3),
  ],
  'phy-2048l': [
    section(10201, '2L01', [{ days: ['T'], periodBegin: '8', periodEnd: '9', building: 'NPB', room: '1100' }], 1),
    section(10202, '2L02', [{ days: ['R'], periodBegin: '3', periodEnd: '4', building: 'NPB', room: '1100' }], 1),
  ],
  'cop-3503c': [
    section(10301, '3C01', [mwf('5', 'CSE', 'A101'), { days: ['T'], periodBegin: '9', periodEnd: '9', building: 'CSE', room: 'E211' }], 4),
    section(10302, '3C02', [tr('3', '4', 'CSE', 'A101')], 4),
  ],
  'cot-3100': [
    section(10401, '4D01', [tr('6', '7', 'CAR', '100')]),
    section(10402, '4D02', [mwf('2', 'CAR', '100')]),
  ],
  'cda-3101': [
    section(10501, '5A01', [mwf('4', 'NEB', '100')]),
    section(10502, '5A02', [tr('6', '7', 'NEB', '100')]),
  ],
  'cis-4930': [
    section(10601, '6T01', [tr('3', '4', 'CSE', 'E119')]),
  ],
  'cap-4630': [
    section(10701, '7A01', [mwf('4', 'CSE', 'E121')]),
    section(10702, '7A02', [tr('8', '9', 'CSE', 'E121')]),
  ],
  'cnt-4714': [
    section(10801, '8D01', [mwf('7', 'LIT', '109')]),
  ],
  'cop-3530': [
    section(10901, '9D01', [mwf('6', 'CSE', 'A101')]),
    section(10902, '9D02', [tr('2', '3', 'CSE', 'A101')]),
  ],
  'cen-3031': [
    section(11001, 'SE01', [tr('4', '5', 'NEB', '202')]),
    section(11002, 'SE02', []),
  ],
  'cop-4600': [
    section(11101, 'OS01', [mwf('8', 'CSE', 'E222')]),
  ],
  'sta-3032': [
    section(11201, 'ST01', [mwf('3', 'FLI', '50')]),
    section(11202, 'ST02', []),
  ],
}

export function getDemoSections(courseId) {
  return DEMO_SECTIONS[courseId] || []
}