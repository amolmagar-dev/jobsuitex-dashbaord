import { applyForJobs, loginToGlassdoor, searchGlassdoorJobs } from "./action.js";
import browserInstance from '../../browser/browser.js';
const browser = await browserInstance.getBrowser();

const page = await browser.newPage();

await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

await loginToGlassdoor(page);
// // scrape the jobs now
// let jobs = await searchGlassdoorJobs(page, 'Software Engineer', 'pune',);


// appying to the jobs
await applyForJobs(browser, [
  {
    title: "Python Full Stack Developer",
    company: "RSquareSoft Technologies",
    location: "Pune",
    salary: "",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/python-full-stack-developer-rsquaresoft-technologies-JV_IC2856202_KO0,27_KE28,52.htm?jl=1009698494629",
    easyApply: true,
  },
  {
    title: "Python Developer",
    company: "Thinkitive Technologies Pvt Ltd",
    location: "Pune",
    salary: "₹4L - ₹7L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/python-developer-thinkitive-technologies-pvt-ltd-JV_IC2856202_KO0,16_KE17,48.htm?jl=1009698507215",
    easyApply: true,
  },
  {
    title: "React Native Developer",
    company: "Foxberry Technology Pvt Ltd",
    location: "India",
    salary: "",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/react-native-developer-foxberry-technology-pvt-ltd-JV_KO0,22_KE23,50.htm?jl=1009698401004",
    easyApply: true,
  },
  {
    title: "Java Full Stack Developer",
    company: "Thinkitive Technologies Pvt Ltd",
    location: "India",
    salary: "",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/java-full-stack-developer-thinkitive-technologies-pvt-ltd-JV_KO0,25_KE26,57.htm?jl=1009698518811",
    easyApply: true,
  },
  {
    title: "Dot Net Developer",
    company: "Mobileprogramming PVT LTD",
    location: "Pune",
    salary: "₹7L - ₹8L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/dot-net-developer-mobileprogramming-pvt-ltd-JV_IC2856202_KO0,17_KE18,43.htm?jl=1009698623689",
    easyApply: true,
  },
  {
    title: "Ruby on Rails Developer",
    company: "Mobileprogramming PVT LTD",
    location: "Pune",
    salary: "₹7L - ₹8L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/ruby-on-rails-developer-mobileprogramming-pvt-ltd-JV_IC2856202_KO0,23_KE24,49.htm?jl=1009698606362",
    easyApply: true,
  },
  {
    title: "PHP Developer",
    company: "Up Market Research",
    location: "India",
    salary: "",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/php-developer-up-market-research-JV_KO0,13_KE14,32.htm?jl=1009698519755",
    easyApply: true,
  },
  {
    title: "Mobile Application Developer",
    company: "Quantastrat Intigrators Pvt Ltd",
    location: "India",
    salary: "₹4L - ₹7L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/mobile-application-developer-quantastrat-intigrators-pvt-ltd-JV_KO0,28_KE29,60.htm?jl=1009698567108",
    easyApply: true,
  },
  {
    title: "Android Developer",
    company: "M-Tech Innovation LTD",
    location: "India",
    salary: "₹4L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/android-developer-m-tech-innovation-ltd-JV_KO0,17_KE18,39.htm?jl=1009698342395",
    easyApply: true,
  },
  {
    title: "Sr.Net Developer",
    company: "Kognivera IT Solution",
    location: "Pune",
    salary: "₹2L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/sr-net-developer-kognivera-it-solution-JV_IC2856202_KO0,16_KE17,38.htm?jl=1009698563275",
    easyApply: true,
  },
  {
    title: "Senior ETL Developer (NA)",
    company: "Hitachi Solutions",
    location: "Pune",
    salary: "₹5L - ₹7L (Glassdoor Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/senior-etl-developer-na-hitachi-solutions-JV_IC2856202_KO0,23_KE24,41.htm?jl=1009698491724",
    easyApply: true,
  },
  {
    title: "PHP Laravel Developer",
    company: "Giggada Technology",
    location: "Pune",
    salary: "₹12T - ₹25T (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/php-laravel-developer-giggada-technology-JV_IC2856202_KO0,21_KE22,40.htm?jl=1009698512220",
    easyApply: true,
  },
  {
    title: "Sr. Fullstack Developer (React + NodeJS/Java)",
    company: "Volley Biz-Tech",
    location: "India",
    salary: "₹15L - ₹30L (Employer Est.)",
    posted: "24h",
    link: "https://www.glassdoor.co.in/job-listing/sr-fullstack-developer-react-nodejs-java-volley-biz-tech-JV_KO0,40_KE41,56.htm?jl=1009698294463",
    easyApply: true,
  },
]) 