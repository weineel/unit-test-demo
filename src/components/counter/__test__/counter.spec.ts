import { mount } from '@vue/test-utils'
import { Counter } from '../index'

it('counter ++', async () => {
  const $wrapper = mount(Counter, {})
  const $button = $wrapper.find('button')

  await $button.trigger('click')

  // await $wrapper.vm.$nextTick()

  expect($button.text())
    .toContain('count is: 1')
})
