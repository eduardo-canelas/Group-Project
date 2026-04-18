import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function usePageMotion() {
  const scope = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          isMobile: '(max-width: 1023px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, reduceMotion } = context.conditions;

          if (reduceMotion) {
            gsap.set('.motion-hero, .motion-card, .motion-section, .motion-float', { clearProps: 'all' });
            return;
          }

          const heroItems = gsap.utils.toArray('.motion-hero');
          const cards = gsap.utils.toArray('.motion-card');
          const sections = gsap.utils.toArray('.motion-section');
          const floats = gsap.utils.toArray('.motion-float');
          const flowPaths = gsap.utils.toArray('.motion-flow-path');
          const lanes = gsap.utils.toArray('.motion-lane');
          const chips = gsap.utils.toArray('.motion-chip');

          gsap.defaults({
            ease: 'power2.out',
            duration: isDesktop ? 0.82 : 0.62,
          });

          if (heroItems.length) {
            gsap.from(heroItems, {
              autoAlpha: 0,
              y: isDesktop ? 30 : 20,
              stagger: isDesktop ? 0.1 : 0.07,
              ease: 'power3.out',
            });
          }

          if (chips.length) {
            gsap.from(chips, {
              x: isDesktop ? -18 : -12,
              scale: 0.94,
              duration: isDesktop ? 0.72 : 0.58,
              delay: isDesktop ? 0.16 : 0.1,
              stagger: isDesktop ? 0.06 : 0.04,
              ease: 'back.out(1.5)',
              clearProps: 'transform',
            });
          }

          if (cards.length) {
            gsap.from(cards, {
              autoAlpha: 0,
              y: isDesktop ? 22 : 14,
              scale: 0.985,
              stagger: isDesktop ? 0.06 : 0.045,
            });
          }

          if (flowPaths.length) {
            gsap.from(flowPaths, {
              autoAlpha: 0,
              scaleX: 0.78,
              transformOrigin: 'left center',
              duration: isDesktop ? 0.7 : 0.55,
              stagger: isDesktop ? 0.08 : 0.05,
              delay: isDesktop ? 0.18 : 0.12,
              ease: 'power2.out',
            });
          }

          if (lanes.length) {
            gsap.from(lanes, {
              autoAlpha: 0,
              x: isDesktop ? 18 : 10,
              y: isDesktop ? 10 : 8,
              duration: isDesktop ? 0.72 : 0.56,
              stagger: isDesktop ? 0.08 : 0.05,
              delay: isDesktop ? 0.18 : 0.12,
              ease: 'power3.out',
            });
          }

          sections.forEach((section) => {
            gsap.from(section, {
              autoAlpha: 0,
              y: isDesktop ? 34 : 18,
              scrollTrigger: {
                trigger: section,
                start: isDesktop ? 'top 82%' : 'top 90%',
                toggleActions: 'play none none none',
              },
            });
          });

          floats.forEach((element, index) => {
            gsap.to(element, {
              y: index % 2 === 0 ? -16 : 16,
              x: index % 2 === 0 ? 8 : -8,
              duration: isDesktop ? 5 + index : 4 + index * 0.6,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          });
        },
      );

      return () => mm.revert();
    },
    { scope },
  );

  return scope;
}
