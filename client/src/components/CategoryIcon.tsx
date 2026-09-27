import React from 'react';
import {
  Utensils,
  Home,
  Car,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Receipt,
  Plane,
  Coins,
  Briefcase,
  TrendingUp,
  Building,
  Tv,
  Dumbbell,
  Zap,
  Wifi,
  MoreHorizontal,
  Tag,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  size?: 'small' | 'medium' | 'large' | number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  size = 'small',
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? size : size === 'small' ? 15 : size === 'medium' ? 18 : 22;

  const props: LucideProps = {
    size: pixelSize,
    className: `shrink-0 ${className}`,
  };

  switch (iconName?.toLowerCase()) {
    case 'fastfood':
    case 'food':
    case 'restaurant':
    case 'utensils':
      return <Utensils {...props} />;
    case 'home':
    case 'rent':
    case 'housing':
      return <Home {...props} />;
    case 'directions_car':
    case 'transport':
    case 'car':
      return <Car {...props} />;
    case 'shopping_bag':
    case 'shopping':
      return <ShoppingBag {...props} />;
    case 'movie':
    case 'entertainment':
      return <Film {...props} />;
    case 'health_and_safety':
    case 'health':
    case 'medical':
      return <HeartPulse {...props} />;
    case 'school':
    case 'education':
      return <GraduationCap {...props} />;
    case 'receipt':
    case 'bills':
    case 'utilities':
      return <Receipt {...props} />;
    case 'flight':
    case 'travel':
      return <Plane {...props} />;
    case 'payments':
    case 'salary':
    case 'income':
      return <Coins {...props} />;
    case 'work':
    case 'freelance':
      return <Briefcase {...props} />;
    case 'trending_up':
    case 'investment':
    case 'investments':
      return <TrendingUp {...props} />;
    case 'business':
      return <Building {...props} />;
    case 'subscriptions':
    case 'subscription':
      return <Tv {...props} />;
    case 'gym':
    case 'fitness':
      return <Dumbbell {...props} />;
    case 'electricity':
      return <Zap {...props} />;
    case 'wifi':
    case 'internet':
      return <Wifi {...props} />;
    case 'more_horiz':
    case 'other':
      return <MoreHorizontal {...props} />;
    default:
      return <Tag {...props} />;
  }
};
