import { VueWrapper, mount } from '@vue/test-utils'
import { Rate } from '../index'
import { range } from 'lodash'

const ScoreRange = range(0, 6)

/**
 * 获取当前显示选中的星星数量
 * @param $wrapper rate wrapper
 */
function getSelectedStar($wrapper: VueWrapper<any>) {
  const $spans = $wrapper.findAll('.rate>div>span')
  // star 的总数量
  const starCount = $spans.length
  // 被选中的 star 数量
  const selectedStar = $spans.filter(e => e.text().trim() === '★').length
  return [starCount, selectedStar]
}

/** 检查选择的 star 数量是否为期望值 */
function expertStarCount($wrapper: VueWrapper<any>, expert: number) {
  const [startCount, selectedStar] = getSelectedStar($wrapper)
  expect(selectedStar)
    .toEqual(expert)
  expect(startCount)
    .toEqual(5)
}

describe('Input', () => {
  function expertInput(input: number, expert: number) {
    const starCount = input
    let $wrapper = mount(Rate, {
      props: {
        modelValue: starCount,
      },
    })

    expertStarCount($wrapper, expert)
  }

  it('Specify a score', () => {
    ScoreRange.forEach(input => {
      expertInput(input, input)
    })
  })

  it('Specify a score, but not in scope', () => {
    const cases = [-1, -1000, 6, 345]
    cases.forEach(input => {
      expertInput(input, 0)
    })
  })
})

describe('Modify input', () => {
  async function expertModifyInput(from: number, to: number, expert: number) {
    let $wrapper = mount(Rate, {
      props: {
        modelValue: 3,
      },
    })

    const targetScore = 4
    await $wrapper.setProps({
      modelValue: targetScore,
    })
  
    expertStarCount($wrapper, targetScore)
  }

  it('3 -> 4', async () => {
    await expertModifyInput(3, 4, 4)
  })

  it('3 -> -3', async () => {
    await expertModifyInput(3, -3, 0)
  })

  it('3 -> 78', async () => {
    await expertModifyInput(3, 78, 0)
  })
})

describe('Props: theme', () => {
  // 单元测试里维护的是需求，如果实现改了，就不满足需求了。
  // 单元测试在改动代码后不通过了，首先是确认需求有改动才应该改测试代码。
  const themes = [
    'black',
    'white',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
  ]

  themes.forEach(theme => {
    it(`theme: ${theme}`, () => {
      let $wrapper = mount(Rate, {
        props: {
          modelValue: 3,
          theme: theme,
        },
      })
      const $div = $wrapper.find('.rate>div')
      expect($div.element).toHaveClass(`rate--${theme}`)
    })
  })
})

describe('Mouse Event', () => {
  it('mouseover: 鼠标移动到第几个星星，显示几分', () => {
    ScoreRange.forEach(async score => {
      let $wrapper = mount(Rate, {
        props: {
          modelValue: 0,
        },
      })
  
      const $span3 = $wrapper.find(`.rate>div>span:nth-child(${score})`)
      await $span3.trigger('mouseover')
      expertStarCount($wrapper, score)
    })
  })

  it('mouseout: 鼠标移入再移出，显示原始分数', async () => {
    let $wrapper = mount(Rate, {
      props: {
        modelValue: 2,
      },
    })

    const $span3 = $wrapper.find('.rate>div>span:nth-child(4)')
    await $span3.trigger('mouseover')
    expertStarCount($wrapper, 4)
    // 鼠标移出显示 2 分
    const $div = $wrapper.find('.rate>div')
    await $div.trigger('mouseout')
    expertStarCount($wrapper, 2)
  })

  // 有没有必要枚举所有分数？
  // 尽量覆盖多的代码分支，而不是尽量枚举所有情况，大多数是没有办法完全枚举的。
  it('click: 鼠标点击第 4 个星星就显示 4 分，且鼠标移出也不会改变', async () => {
    let $wrapper = mount(Rate, {
      props: {
        modelValue: 0,
      },
    })

    const $span4 = $wrapper.find(`.rate>div>span:nth-child(4)`)
    await $span4.trigger('click')
    // 取到点击后设置的值
    const value = ($wrapper.emitted()['update:modelValue'][0] as any)[0]
    expect(value).toBe(4)
    $wrapper.setProps({
      modelValue: value,
    })

    expertStarCount($wrapper, 4)

    // 鼠标移出
    const $div = $wrapper.find('.rate>div')
    await $div.trigger('mouseout')
    expertStarCount($wrapper, 4)
  })
})
