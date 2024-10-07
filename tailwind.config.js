/** @type {(tailwindConfig: object) => object} */
const withMT = require("@material-tailwind/react/utils/withMT");
module.exports = withMT( {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	screens: {
  		sm: '640px',
  		md: '768px',
  		lg: '1024px',
  		xl: '1280px',
  		'2xl': '1536px'
  	},
  	extend: {
		animation: {
			'bounce-short': 'bounce 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0.5'
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"),
	  function ({addUtilities}) {
		const newUtilities = {
			".scrollbar-thin": {
				scrollbarWidth: "thin",
				scrollbarColor: "rgba(101,164,206,255) rgba(0, 0, 0, 0.05)"
			},
			".scrollbar-none": {
				scrollbarWidth: "none"
			},
			".scrollbar-webkit": {
				"&::-webkit-scrollbar": {
					width: "3px",
					scrollbarWidth: "thin",
					borderRadius: "30px",
					color: "rgba(101,164,206,0.55)",
					scrollbarColor: "rgba(101,164,206,0.55)"
				},
				"&::-webkit-scrollbar-track": {
					backgroundColor: "rgba(0, 0, 0, 0.1)",
					borderRadius: "30px",
				},
				"&::-webkit-scrollbar-thumb": {
					backgroundColor: "rgba(0, 0, 0, 0.2)",
					borderRadius: "30px",
					border: "0px solid rgba(0, 0, 0, 0.1)"
				}
			}

		}

		addUtilities(newUtilities, ["responsive", "hover"])
		  
	  }
  ],
});