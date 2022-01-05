import { DOMWrapper, mount } from '@vue/test-utils'
import { Counter } from '../index'

let $wrapper
let $button: DOMWrapper<Element>

beforeEach(() => {
  $wrapper = mount(Counter, {})
  $button = $wrapper.find('button')
})

it('counter +', async () => {
  await $button.trigger('click')

  // await $wrapper.vm.$nextTick()

  expect($button.text())
    .toContain('count is: 1')
})

it('counter ++', async () => {
  await $button.trigger('click')
  await $button.trigger('click')

  expect($button.text())
    .toContain('count is: 2')
})
