import { describe, expect, it } from 'vitest'
import { cleanItems, isCustomId, isList, newListId, parseCsv } from './lists'

describe('cleanItems', () => {
  it('trims, drops blanks, and keeps the first of any duplicates', () => {
    expect(cleanItems([' Ada ', '', 'Grace', 'Ada', '   '])).toEqual(['Ada', 'Grace'])
  })
})

describe('parseCsv', () => {
  it('takes the first column, so a roster keeps names and drops ids and emails', () => {
    const csv = ['Name,Id,Email', 'Ada,1,ada@x.edu', 'Grace,2,grace@x.edu'].join('\n')
    expect(parseCsv(csv)).toEqual(['Name', 'Ada', 'Grace'])
  })

  it('honours quoting, so a name containing a comma stays one entry', () => {
    expect(parseCsv('"Nguyen, Anh",2')).toEqual(['Nguyen, Anh'])
  })

  it('unescapes doubled quotes inside a quoted field', () => {
    expect(parseCsv('"She said ""hi""",1')).toEqual(['She said "hi"'])
  })

  it('handles CRLF line endings from spreadsheet exports', () => {
    expect(parseCsv('Ada,1\r\nGrace,2\r\n')).toEqual(['Ada', 'Grace'])
  })

  it('skips duplicates and blank rows', () => {
    expect(parseCsv('Ada\n\nAda\nGrace\n')).toEqual(['Ada', 'Grace'])
  })
})

describe('list ids', () => {
  it('marks custom ids apart from built-in source ids', () => {
    expect(isCustomId(newListId())).toBe(true)
    expect(isCustomId('animal')).toBe(false)
  })

  it('generates distinct ids', () => {
    const ids = new Set(Array.from({ length: 200 }, newListId))
    expect(ids.size).toBe(200)
  })
})

describe('isList', () => {
  it('accepts a well-formed list and rejects malformed ones', () => {
    expect(isList({ id: 'custom:a', name: 'Roster', items: ['Ada'] })).toBe(true)
    expect(isList({ id: 'custom:a', name: 'Roster' })).toBe(false)
    expect(isList({ id: 'custom:a', name: 'Roster', items: [1, 2] })).toBe(false)
    expect(isList(null)).toBe(false)
  })
})
