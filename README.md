<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/vbouzon/ledgstr-extension-chrome">
    <img src="src/assets/img/icon-128.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Ledgstr - Chrome extension</h3>

  <p align="center">
    A basic Chrome extension compatible with NIP-07 and communicating with the Ledgstr app
    <br />
    <a href="https://github.com/vbouzon/ledgstr-extension-chrome/issues">Report Bug</a>
    ·
    <a href="https://github.com/vbouzon/ledgstr-extension-chrome/issues">Request Feature</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

This is a basic Chrome extension compatible with NIP-07 and communicating with [the Ledgstr app](https://github.com/vbouzon/ledgstr-app).

<!-- GETTING STARTED -->

### Client compatibility

- Snort.social: ✔️
- Coracle: ✔️
- Iris.to: ✔️

### Prerequisites

To build and use this project you need to have the following installed:

- node >= 18
- Ledgstr App installed (https://github.com/vbouzon/ledgstr-app)

## Getting Started

1. Clone the repo
   ```sh
   git clone https://github.com/vbouzon/ledgstr-extension-chrome.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run NPM start
   ```sh
   npm run start
   ```
4. Load your extension on Chrome following:
   - i. Access chrome://extensions/
   - ii. Check Developer mode
   - iii. Click on Load unpacked extension
   - iv. Select the build folder.

<!-- ROADMAP -->

## Roadmap

- [ ] Permissions & approval - WIP
- [ ] Add NIP-04 support
- [ ] Add Ledger Nano X bluethooth support
- [ ] Add Ledger Speculos support
- [ ] Add integration tests

See the [open issues](https://github.com/vbouzon/ledgstr-extension-chrome/issues) for a full list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<!-- CONTACT -->

## Contact

Vincent Bouzon - [@vincent](https://nostr.band/npub1umpngr838pwy3hgevlpgkuprfe6jsfzm8syf5cqm8eppwmhh69sq6e7a5s)

Project Link: [https://github.com/vbouzon/ledgstr-extension-chrome](https://github.com/vbouzon/ledgstr-extension-chrome)

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Chome Extension Boilerplate by lxieyang](https://github.com/lxieyang/chrome-extension-boilerplate-react)
- [Horse Nostr extension by fiatjaf](https://github.com/fiatjaf/horse)
- My wife for the beautiful logo and her eternal support.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/vbouzon/ledgstr-extension-chrome.svg?style=for-the-badge
[contributors-url]: https://github.com/vbouzon/ledgstr-extension-chrome/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/vbouzon/ledgstr-extension-chrome.svg?style=for-the-badge
[forks-url]: https://github.com/vbouzon/ledgstr-extension-chrome/network/members
[stars-shield]: https://img.shields.io/github/stars/vbouzon/ledgstr-extension-chrome.svg?style=for-the-badge
[stars-url]: https://github.com/vbouzon/ledgstr-extension-chrome/stargazers
[issues-shield]: https://img.shields.io/github/issues/vbouzon/ledgstr-extension-chrome.svg?style=for-the-badge
[issues-url]: https://github.com/vbouzon/ledgstr-extension-chrome/issues
[license-shield]: https://img.shields.io/github/license/vbouzon/ledgstr-extension-chrome.svg?style=for-the-badge
[license-url]: https://github.com/vbouzon/ledgstr-extension-chrome/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/bouzon
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com
