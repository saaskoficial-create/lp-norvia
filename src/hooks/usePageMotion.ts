import { useEffect } from 'react'
import type { RefObject } from 'react'
import '../motion.css'

const preferenceKey = 'norvia-motion-paused'
const changeEvent = 'norvia:motion-change'

type MotionEvent = CustomEvent<{ paused: boolean }>
type GSAP = (typeof import('gsap'))['gsap']
type ScrollTriggerAPI = (typeof import('gsap/ScrollTrigger'))['ScrollTrigger']

const savedPause = () => {
  try { return localStorage.getItem(preferenceKey) === '1' } catch { return false }
}

/** Motion is optional: pause and reduced motion both restore readable static content. */
export function usePageMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = root.current
    if (!node) return
    const scope: HTMLElement = node
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let userPaused = savedPause()
    let disposed = false
    let loading = false
    let idle: number | undefined
    let refreshFrame: number | undefined
    let fallback: ReturnType<typeof setTimeout> | undefined
    let gsapApi: GSAP | undefined
    let triggerApi: ScrollTriggerAPI | undefined
    let stopAnimations: (() => void) | undefined

    function isPaused() { return userPaused || preference.matches }
    function updateControls() {
      const paused = isPaused()
      document.documentElement.setAttribute('data-motion', paused ? 'paused' : 'active')
      const replay = scope.querySelector<HTMLButtonElement>('[data-leak-replay]')
      if (replay && gsapApi) {
        replay.hidden = false
        replay.disabled = paused
        if (paused) replay.setAttribute('aria-busy', 'false')
      }
    }

    function stop() {
      stopAnimations?.()
      stopAnimations = undefined
      updateControls()
    }

    function start() {
      stop()
      if (disposed || isPaused() || !gsapApi || !triggerApi) return
      const gsap = gsapApi
      const ScrollTrigger = triggerApi
      gsap.registerPlugin(ScrollTrigger)
      const media = gsap.matchMedia()
      const context = gsap.context(() => {
        media.add({ desktop: '(min-width: 1001px)', mobile: '(max-width: 1000px)' }, (mode) => {
          const desktop = Boolean(mode.conditions?.desktop)
          const modeCleanup: Array<() => void> = []
          const reveal = (selector: string, distance = 34, baseDelay = 0) => {
            gsap.utils.toArray<HTMLElement>(selector, scope).forEach((target, index) => {
              gsap.fromTo(target,
                { y: distance, opacity: .2, scale: .975 },
                {
                  y: 0, opacity: 1, scale: 1, duration: .68,
                  delay: (index % 3) * baseDelay, ease: 'power3.out',
                  immediateRender: false, clearProps: 'transform,opacity',
                  scrollTrigger: { trigger: target, start: 'top 89%', once: true },
                },
              )
            })
          }
          reveal('.problem-visual', desktop ? 38 : 26)
          reveal('.operation-explorer', desktop ? 38 : 26)
          reveal('.coverage-item', desktop ? 38 : 26, .075)
          if (!scope.querySelector('[data-process-step]')) reveal('.process-list > li', desktop ? 38 : 26, .09)
          reveal('.diagnosis-symbol', 24)

          // The promise and conversion remain visible. The supporting circuit tells the story.
          const hero = scope.querySelector('.hero')
          if (hero && hero.getBoundingClientRect().bottom > 100) {
            const heroIntro = gsap.timeline({ defaults: { ease: 'power3.out' } })
            const shieldPaths = gsap.utils.toArray<SVGPathElement>('.circuit-shield svg path, .circuit-items svg path', scope)
            heroIntro.fromTo('.circuit-rule', { scaleX: 0 }, { scaleX: 1, duration: .95, transformOrigin: 'center' }, 0)
              .fromTo('.circuit-shield', { scale: .72, rotation: -9, opacity: .3 }, { scale: 1, rotation: 0, opacity: 1, duration: .8, clearProps: 'transform,opacity' }, .05)
              .fromTo('.circuit-items > div', { y: 28, opacity: .25, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .75, stagger: .13, clearProps: 'transform,opacity' }, .35)
            if (shieldPaths.length) {
              heroIntro.set(shieldPaths,
                { strokeDasharray: (_index: number, path: SVGPathElement) => `${path.getTotalLength()} ${path.getTotalLength()}`, strokeDashoffset: (_index: number, path: SVGPathElement) => path.getTotalLength() }, .3)
                .to(shieldPaths,
                  { strokeDashoffset: 0, duration: .9, stagger: .045, clearProps: 'strokeDasharray,strokeDashoffset' }, .3)
            }
          }

          if (desktop) {
            gsap.to('.hero-backdrop img', {
              yPercent: 9, scale: 1.07, ease: 'none',
              scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 },
            })
            gsap.fromTo('.problem-visual > img', { yPercent: -5, scale: 1.14 }, {
              yPercent: 5, scale: 1.14, ease: 'none', immediateRender: false,
              scrollTrigger: { trigger: '.problem-visual', start: 'top bottom', end: 'bottom top', scrub: .8 },
            })
            gsap.fromTo('.statement-section > img', { yPercent: -7, scale: 1.16 }, {
              yPercent: 7, scale: 1.16, ease: 'none', immediateRender: false,
              scrollTrigger: { trigger: '.statement-section', start: 'top bottom', end: 'bottom top', scrub: .8 },
            })
          }

          gsap.fromTo('.statement-content h2', { scale: .92, opacity: .45, y: 26 }, {
            scale: 1, opacity: 1, y: 0, transformOrigin: 'left center',
            ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: '.statement-section', start: 'top 90%', end: 'top 35%', scrub: .6 },
          })

          const processLine = scope.querySelector('[data-process-line]')
          const processStory = scope.querySelector<HTMLElement>('.process-story')
          if (processStory && desktop) {
            const steps = Array.from(processStory.querySelectorAll<HTMLElement>('[data-process-step]'))
            const panels = Array.from(processStory.querySelectorAll<HTMLElement>('[data-process-panel]'))
            const originals = [
              ...steps.map(element => ({ element, style: element.getAttribute('style'), active: element.getAttribute('data-process-active'), hidden: element.getAttribute('aria-hidden'), highlighted: element.classList.contains('is-active') })),
              ...panels.map(element => ({ element, style: element.getAttribute('style'), active: element.getAttribute('data-process-active'), hidden: element.getAttribute('aria-hidden'), highlighted: element.classList.contains('is-active') })),
            ]
            const panelTweens = new Map<HTMLElement, ReturnType<GSAP['to']>>()
            let selected = -1
            const activate = (index: number, instant = false) => {
              if (disposed || isPaused() || index === selected || !panels.length) return
              selected = index
              steps.forEach((step, position) => {
                step.classList.toggle('is-active', position === index)
                step.setAttribute('data-process-active', position === index ? 'true' : 'false')
              })
              panels.forEach((panel) => {
                const active = Number(panel.getAttribute('data-step-index')) === index
                panel.setAttribute('aria-hidden', active ? 'false' : 'true')
                panel.setAttribute('data-process-active', active ? 'true' : 'false')
                panelTweens.get(panel)?.kill()
                if (instant) gsap.set(panel, { opacity: active ? 1 : 0, scale: active ? 1 : .96 })
                else {
                  const tween = gsap.to(panel, {
                    opacity: active ? 1 : 0, scale: active ? 1 : .96,
                    duration: .5, ease: 'power2.out', overwrite: 'auto',
                    onComplete: () => { if (panelTweens.get(panel) === tween) panelTweens.delete(panel) },
                  })
                  panelTweens.set(panel, tween)
                }
              })
            }
            if (steps.length && panels.length) {
              activate(0, true)
              steps.forEach((step, index) => ScrollTrigger.create({
                trigger: step, start: 'center 55%',
                onEnter: () => activate(index),
                onLeaveBack: () => activate(Math.max(0, index - 1)),
              }))
              if (processLine) gsap.fromTo(processLine, { scaleY: 0 }, {
                scaleY: 1, transformOrigin: 'center top', ease: 'none',
                scrollTrigger: { trigger: '.process-story-list', start: 'top 55%', end: 'bottom 55%', scrub: .5 },
              })
              modeCleanup.push(() => {
                panelTweens.forEach(tween => tween.kill())
                panelTweens.clear()
                for (const { element, style, active, hidden, highlighted } of originals) {
                  if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style)
                  if (active === null) element.removeAttribute('data-process-active'); else element.setAttribute('data-process-active', active)
                  if (hidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', hidden)
                  element.classList.toggle('is-active', highlighted)
                }
              })
            }
          } else if (processLine && !processStory) {
            gsap.fromTo(processLine, { scaleX: 0 }, {
              scaleX: 1, transformOrigin: 'left center', ease: 'none',
              scrollTrigger: { trigger: '.process-track', start: 'top 78%', end: 'bottom 35%', scrub: .5 },
            })
          }

          const exposure = scope.querySelector<HTMLElement>('.data-exposure')
          const replay = exposure?.querySelector<HTMLButtonElement>('[data-leak-replay]')
          const paths = exposure ? Array.from(exposure.querySelectorAll<SVGPathElement>('[data-leak-path]')) : []
          const nodes = exposure ? Array.from(exposure.querySelectorAll<HTMLElement>('[data-leak-node]')) : []
          const packets = exposure ? Array.from(exposure.querySelectorAll<SVGCircleElement>('[data-leak-packet]')) : []
          if (exposure && paths.length && nodes.length) {
            const originals = packets.map(packet => ({ packet, cx: packet.getAttribute('cx'), cy: packet.getAttribute('cy') }))
            const originalPaths = paths.map(path => ({ path, dasharray: path.getAttribute('stroke-dasharray'), dashoffset: path.getAttribute('stroke-dashoffset') }))
            const sequence = gsap.timeline({
              paused: true,
              onStart: () => {
                exposure.setAttribute('data-leak-play', 'running')
                if (replay) { replay.disabled = true; replay.setAttribute('aria-busy', 'true') }
              },
              onComplete: () => {
                exposure.setAttribute('data-leak-play', 'complete')
                if (replay) { replay.disabled = isPaused(); replay.setAttribute('aria-busy', 'false') }
              },
            })
            sequence.fromTo(nodes[0], { y: 22, opacity: .2, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .55, immediateRender: false }, 0)
            paths.forEach((path, index) => {
              const length = path.getTotalLength()
              const begin = index === 0 ? .55 : 2.85
              // Set SVG attributes explicitly on every replay. A from-only CSS
              // dasharray can be auto-reverted by GSAP while the offset tweens.
              sequence.set(path, {
                attr: { 'stroke-dasharray': `${length} ${length}`, 'stroke-dashoffset': length },
                immediateRender: false,
              }, 0)
              sequence.to(path, { attr: { 'stroke-dashoffset': 0 }, duration: 1.35, ease: 'power1.inOut' }, begin)
              const packet = packets.find(item => item.getAttribute('data-leak-route') === path.id)
              if (packet) {
                const cursor = { progress: 0 }
                sequence.set(packet, { opacity: 1 }, begin)
                sequence.fromTo(cursor, { progress: 0 }, {
                  progress: 1, duration: 1.85, ease: 'none', immediateRender: false,
                  onUpdate: () => {
                    const point = path.getPointAtLength(cursor.progress * length)
                    packet.setAttribute('cx', String(point.x))
                    packet.setAttribute('cy', String(point.y))
                  },
                }, begin + .2)
                sequence.to(packet, { opacity: 0, duration: .3 }, begin + 1.95)
              }
              if (nodes[index + 1]) {
                sequence.fromTo(nodes[index + 1], { y: 22, opacity: .2, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .6, immediateRender: false }, begin + 1.8)
              }
            })
            // Six-second illustration, then a stable result; no perpetual loop.
            sequence.to({}, { duration: .3 }, 5.6)
            ScrollTrigger.create({ trigger: exposure, start: 'top 70%', once: true, onEnter: () => sequence.restart() })
            const replaySequence = () => { if (!isPaused()) sequence.restart() }
            window.addEventListener('norvia:replay-exposure', replaySequence)
            if (replay) { replay.hidden = false; replay.disabled = false }
            const restore = () => {
              sequence.kill()
              window.removeEventListener('norvia:replay-exposure', replaySequence)
              exposure.removeAttribute('data-leak-play')
              for (const { packet, cx, cy } of originals) {
                if (cx === null) packet.removeAttribute('cx'); else packet.setAttribute('cx', cx)
                if (cy === null) packet.removeAttribute('cy'); else packet.setAttribute('cy', cy)
              }
              for (const { path, dasharray, dashoffset } of originalPaths) {
                if (dasharray === null) path.removeAttribute('stroke-dasharray'); else path.setAttribute('stroke-dasharray', dasharray)
                if (dashoffset === null) path.removeAttribute('stroke-dashoffset'); else path.setAttribute('stroke-dashoffset', dashoffset)
              }
              if (replay) { replay.disabled = true; replay.setAttribute('aria-busy', 'false') }
            }
            modeCleanup.push(restore)
          }
          return () => modeCleanup.forEach(dispose => dispose())
        })
      }, scope)
      stopAnimations = () => {
        media.revert()
        context.revert()
      }
      updateControls()
    }

    async function load() {
      if (loading || gsapApi || disposed || isPaused()) return
      loading = true
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
        if (disposed) return
        gsapApi = gsap
        triggerApi = ScrollTrigger
        start()
      } catch {
        // A download failure leaves the ordinary static page and all CTAs usable.
      } finally { loading = false }
    }

    function schedule() {
      if (disposed || isPaused()) return
      if (gsapApi) { start(); return }
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => { void load() }, { timeout: 1100 })
      else fallback = setTimeout(() => { void load() }, 300)
    }
    function changed(event: Event) {
      userPaused = (event as MotionEvent).detail?.paused ?? savedPause()
      stop()
      if (!isPaused()) schedule()
    }
    function systemChanged() { stop(); if (!isPaused()) schedule() }
    function disclosureChanged() {
      if (disposed || isPaused() || !triggerApi) return
      if (refreshFrame !== undefined) window.cancelAnimationFrame(refreshFrame)
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = undefined
        if (!disposed && !isPaused()) triggerApi?.refresh()
      })
    }
    updateControls()
    window.addEventListener(changeEvent, changed)
    preference.addEventListener('change', systemChanged)
    scope.addEventListener('toggle', disclosureChanged, true)
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      disposed = true
      window.removeEventListener('load', schedule)
      window.removeEventListener(changeEvent, changed)
      preference.removeEventListener('change', systemChanged)
      scope.removeEventListener('toggle', disclosureChanged, true)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      if (refreshFrame !== undefined) window.cancelAnimationFrame(refreshFrame)
      clearTimeout(fallback)
      stop()
    }
  }, [root])
}
