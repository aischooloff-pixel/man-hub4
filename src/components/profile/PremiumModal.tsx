import { useState, useRef } from 'react';
import { X, Check, Crown, Sparkles, MessageCircle, Users, Infinity, BadgeCheck, Bot, FileText, Headphones, Music, ShoppingBag, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [currentSlide, setCurrentSlide] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Базовый доступ к платформе',
      price: { monthly: 0, yearly: 0 },
      originalPrice: { monthly: 0, yearly: 0 },
      features: [
        { icon: FileText, text: '3 статьи в день' },
        { icon: Headphones, text: 'Подкасты' },
        { icon: Music, text: 'Плейлисты' },
      ],
      popular: false,
    },
    {
      id: 'plus',
      name: 'Plus',
      description: 'Расширенные возможности',
      price: { monthly: 299, yearly: 2990 },
      originalPrice: { monthly: 598, yearly: 5980 },
      features: [
        { icon: MessageCircle, text: 'Соц сети в профиле' },
        { icon: Bot, text: 'ИИ ассистент' },
        { icon: Users, text: 'Закрытое сообщество' },
        { icon: Infinity, text: 'Безлимитные публикации' },
        { icon: BadgeCheck, text: 'PRO значок' },
      ],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Максимум возможностей',
      price: { monthly: 2490, yearly: 24900 },
      originalPrice: { monthly: 4980, yearly: 49800 },
      features: [
        { icon: Sparkles, text: 'Все что в Plus' },
        { icon: Crown, text: 'Сообщество предпринимателей' },
        { icon: GraduationCap, text: 'Менторство от основателя' },
        { icon: ShoppingBag, text: 'Продажа своего продукта' },
      ],
      popular: false,
    },
  ];

  const handlePayment = (planId: string) => {
    console.log('Processing payment for', planId, 'plan,', billingPeriod);
    onClose();
  };

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const slideWidth = container.offsetWidth * 0.85;
      container.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const slideWidth = container.offsetWidth * 0.85;
      const newSlide = Math.round(container.scrollLeft / slideWidth);
      setCurrentSlide(newSlide);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[95vh] overflow-y-auto rounded-t-2xl bg-card animate-slide-up',
          'md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:max-h-[90vh]'
        )}
      >
        <div className="sticky top-0 z-10 flex justify-center bg-card pt-3 md:hidden">
          <div className="h-1 w-12 rounded-full bg-border" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 z-20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="mb-2 font-heading text-2xl font-bold">Выберите тариф</h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                Скидка 50%
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Выберите годовой тариф для экономии до 50%
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center rounded-full bg-secondary p-1">
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
                  billingPeriod === 'yearly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Год
              </button>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
                  billingPeriod === 'monthly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Месяц
              </button>
            </div>
          </div>

          {/* Plans - Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 mb-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border-2 p-6 transition-all',
                  plan.popular
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Выбирают чаще
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-3xl font-bold">
                      {plan.price[billingPeriod]}₽
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{billingPeriod === 'monthly' ? 'мес' : 'год'}
                    </span>
                  </div>
                  {plan.originalPrice[billingPeriod] > 0 && (
                    <p className="text-sm text-muted-foreground line-through">
                      {plan.originalPrice[billingPeriod]}₽
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => plan.id === 'free' ? null : (plan.id === 'plus' || plan.id === 'premium') ? null : handlePayment(plan.id)}
                  className={cn(
                    'w-full',
                    plan.id === 'free' ? 'variant-secondary' : ''
                  )}
                  variant={plan.id === 'free' ? 'secondary' : 'default'}
                  disabled={plan.id === 'plus' || plan.id === 'premium'}
                >
                  {plan.id === 'free' ? 'Текущий план' : 'Скоро'}
                </Button>
              </div>
            ))}
          </div>

          {/* Plans - Mobile Carousel */}
          <div className="md:hidden mb-6">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex-shrink-0 w-[85%] rounded-2xl border-2 p-5 snap-center transition-all',
                    plan.popular
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border bg-card'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground whitespace-nowrap">
                        Выбирают чаще
                      </span>
                    </div>
                  )}

                  <div className="mb-4 mt-2">
                    <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-bold">
                        {plan.price[billingPeriod]}₽
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'мес' : 'год'}
                      </span>
                    </div>
                    {plan.originalPrice[billingPeriod] > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        {plan.originalPrice[billingPeriod]}₽
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => plan.id === 'free' ? null : null}
                    className="w-full"
                    variant={plan.id === 'free' ? 'secondary' : 'default'}
                    disabled={plan.id === 'plus' || plan.id === 'premium'}
                  >
                    {plan.id === 'free' ? 'Текущий план' : 'Скоро'}
                  </Button>
                </div>
              ))}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {plans.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    currentSlide === index
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-border'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Info text */}
          <p className="text-center text-sm text-muted-foreground">
            Подробная информация о тарифах доступна в нашем Telegram-канале
          </p>
        </div>
      </div>
    </div>
  );
}
