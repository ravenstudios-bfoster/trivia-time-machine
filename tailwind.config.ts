
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// BTTF custom color scheme
				bttf: {
					red: '#FF3131',
					yellow: '#FFC72C',
					blue: '#00A3FF', 
					pink: '#FF00FF',
					orange: '#FF7A00',
					purple: '#9B30FF',
					black: '#121212',
					silver: '#E0E0E0',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'flux-capacitor': {
					'0%, 100%': { 
						opacity: '0.4',
						filter: 'blur(4px)'
					},
					'50%': { 
						opacity: '1',
						filter: 'blur(0px)'
					}
				},
				'time-circuit': {
					'0%': { 
						opacity: '0.7',
						textShadow: '0 0 8px hsl(var(--primary))'
					},
					'50%': { 
						opacity: '1',
						textShadow: '0 0 12px hsl(var(--primary)), 0 0 20px hsl(var(--primary))'
					},
					'100%': { 
						opacity: '0.7',
						textShadow: '0 0 8px hsl(var(--primary))'
					}
				},
				'lightning-flash': {
					'0%, 100%': { 
						opacity: '0' 
					},
					'10%, 30%, 50%, 70%, 90%': { 
						opacity: '1' 
					},
					'20%, 40%, 60%, 80%': { 
						opacity: '0.5' 
					}
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 12px rgba(255, 122, 0, 0.7), 0 0 20px rgba(255, 122, 0, 0.5)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(255, 122, 0, 0.9), 0 0 30px rgba(255, 122, 0, 0.7)'
					}
				},
				'time-travel': {
					'0%': {
						transform: 'translateX(0) scale(1)',
						opacity: '1'
					},
					'50%': {
						transform: 'translateX(10px) scale(1.05)',
						opacity: '0.7'
					},
					'100%': {
						transform: 'translateX(0) scale(1)',
						opacity: '1'
					}
				},
				'hover-float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'chrome-shine': {
					'0%': {
						backgroundPosition: '-100% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'flux-capacitor': 'flux-capacitor 2s infinite ease-in-out',
				'time-circuit': 'time-circuit 1.5s infinite ease-in-out',
				'lightning-flash': 'lightning-flash 3s infinite',
				'glow-pulse': 'glow-pulse 3s infinite ease-in-out',
				'time-travel': 'time-travel 0.5s ease-in-out',
				'hover-float': 'hover-float 3s infinite ease-in-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'chrome-shine': 'chrome-shine 3s linear infinite'
			},
			backgroundImage: {
				'hill-valley': "url('/public/lovable-uploads/2c5b1dd6-f659-4d85-bb88-f34f19bbb343.png')",
				'delorean': "url('/public/lovable-uploads/9f6aabdb-e642-4127-a49d-c5b5e2931e0b.png')",
				'chrome-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
				'neon-grid': 'linear-gradient(0deg, rgba(0,163,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,163,255,0.15) 1px, transparent 1px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
