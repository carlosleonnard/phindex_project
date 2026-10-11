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
		fontFamily: {
			sans: ["'Vollkorn'", 'Georgia', "'Times New Roman'", 'serif'],
			serif: ["'Vollkorn'", 'Georgia', "'Times New Roman'", 'serif'],
			mono: ["'Vollkorn'", 'Georgia', "'Times New Roman'", 'serif'],
			// Corte em versalete da mesma família: substitui caixa alta com
			// tracking largo em rótulos, contagens e números de índice.
			sc: ["'Vollkorn SC'", "'Vollkorn'", 'Georgia', 'serif'],
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			// Tempos nomeados: as formas arbitrárias (duration-[350ms], ease-[cubic-bezier(...)])
			// são ambíguas com o tailwindcss-animate e o Tailwind não as gera.
			transitionDuration: { 250: '250ms', 350: '350ms' },
			transitionTimingFunction: { kt: 'cubic-bezier(.22,1,.36,1)' },
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'phindex-teal': 'hsl(var(--phindex-teal))',
				'phindex-dark': 'hsl(var(--phindex-dark))',
				'phindex-light': 'hsl(var(--phindex-light))',
				'modal-background': 'hsl(var(--modal-background))',
				'modal-card': 'hsl(var(--modal-card))',
				'modal-hover': 'hsl(var(--modal-hover))',
				'modal-text': 'hsl(var(--modal-text))',
				'modal-accent': 'hsl(var(--modal-accent))',
				'category-primary': 'hsl(var(--category-primary))',
				'category-secondary': 'hsl(var(--category-secondary))',
				/**
				 * KARYOTYPE — a paleta do redesign, em hex porque as faixas de
				 * cromossomo combinam estes valores dentro de gradientes.
				 * São os mesmos tokens de index.css; `b25/b50/b75` são o teal
				 * a 25, 50 e 75% sobre branco (as classes gpos do G-banding).
				 */
				kt: {
					paper: '#F9FAFB',
					sheet: '#FFFFFF',
					wash: '#F0F4F4',
					wash2: '#E8EEEF',
					seg: '#E3ECEE',
					rule: '#DCE0E5',
					ink: '#192A43',
					slate: '#304A50',
					body: '#4F6772',
					mute: '#6C8C93',
					teal: '#287A8A',
					glow: '#349DB2',
					deep: '#001F23',
					deep2: '#0A363D',
					b25: '#C9DEE2',
					b50: '#94BCC5',
					b75: '#5E9BA7'
				},
				region: {
					africa: '#EE9D2B',
					americas: '#3FA673',
					asia: '#DF5549',
					europe: '#2E8B9E',
					mideast: '#8D69BF',
					oceania: '#428CD7'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-modal': 'var(--gradient-modal)'
			},
			boxShadow: {
				'glow': 'var(--shadow-glow)',
				'card': 'var(--shadow-card)',
				'button': 'var(--shadow-button)',
				'modal': 'var(--shadow-modal)'
			},
			transitionProperty: {
				'smooth': 'var(--transition-smooth)',
				'fast': 'var(--transition-fast)'
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
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'glow': {
					'0%, 100%': { opacity: '0.5' },
					'50%': { opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'band-in': {
					from: { clipPath: 'inset(0 100% 0 0)' },
					to: { clipPath: 'inset(0 0 0 0)' }
				},
				rise: {
					from: { opacity: '0', transform: 'translateY(16px)' },
					to: { opacity: '1', transform: 'none' }
				},
				probe: {
					'0%, 100%': { boxShadow: '0 0 0 3px rgba(52,157,178,.55)' },
					'50%': { boxShadow: '0 0 0 8px rgba(52,157,178,.12)' }
				},
				drift: {
					'0%, 100%': { transform: 'translateX(0)' },
					'50%': { transform: 'translateX(6px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'band-in': 'band-in 1.4s cubic-bezier(.22,1,.36,1) .35s backwards',
				rise: 'rise .9s cubic-bezier(.22,1,.36,1) backwards',
				'rise-fast': 'rise .5s cubic-bezier(.22,1,.36,1) backwards',
				probe: 'probe 2.8s ease-in-out infinite',
				drift: 'drift 3.2s ease-in-out infinite'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: any) {
			addUtilities({
				'.scrollbar-hide': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',
					'&::-webkit-scrollbar': {
						display: 'none'
					}
				},
				// Barra de rolagem fina, nas cores do tema: aparece para dizer
				// que a lista continua, sem o peso da barra cinza do sistema.
				'.scrollbar-slim': {
					'scrollbar-width': 'thin',
					'scrollbar-color': 'hsl(var(--border)) transparent',
					'&::-webkit-scrollbar': {
						width: '6px'
					},
					'&::-webkit-scrollbar-track': {
						background: 'transparent'
					},
					'&::-webkit-scrollbar-thumb': {
						background: 'hsl(var(--border))',
						'border-radius': '9999px'
					},
					'&::-webkit-scrollbar-thumb:hover': {
						background: 'hsl(var(--muted-foreground) / 0.5)'
					}
				}
			})
		}
	]
} satisfies Config;
