/* ==========================================
   SADARUWAN WATER SOLUTION
   WEBSITE JAVASCRIPT
   ========================================== */

"use strict";

// Replace this with your actual WhatsApp number.
// Use country code 94 and omit the first zero.
const WHATSAPP_NUMBER = "94779683018";

document.addEventListener("DOMContentLoaded", function () {

    // Job number is provided by the SQLite database (not browser storage).
    const jobNumberInput = document.getElementById("jobNumber");
    const JOB_API = "/api/next-job-number";

    async function loadNextJobNumber() {
        if (!jobNumberInput) return;
        try {
            const response = await fetch(JOB_API);
            if (!response.ok) throw new Error("Could not load job number");
            const data = await response.json();
            jobNumberInput.value = data.job_number;
        } catch (error) {
            jobNumberInput.value = "Assigned when submitted";
        }
    }
    loadNextJobNumber();

    // ---------------------------------------
    // 1. AUTOMATIC COPYRIGHT YEAR
    // ---------------------------------------

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    // ---------------------------------------
    // 2. MOBILE NAVIGATION
    // ---------------------------------------

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    function closeMenu() {
        if (!menuToggle || !navMenu) return;

        menuToggle.classList.remove("is-open");
        navMenu.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    }

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", function () {

            const isOpen = navMenu.classList.toggle("active");

            menuToggle.classList.toggle("is-open", isOpen);
            menuToggle.setAttribute("aria-expanded", String(isOpen));

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation menu" : "Open navigation menu"
            );
        });

        // Close the mobile menu after selecting a link.
        navMenu.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {
                closeMenu();
            });

        });

        // Close the menu when clicking outside it.
        document.addEventListener("click", function (event) {

            if (
                navMenu.classList.contains("active") &&
                !navMenu.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {
                closeMenu();
            }

        });

        // Close menu with Escape.
        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape") {
                closeMenu();
            }

        });

        // Reset mobile menu when resizing to desktop.
        window.addEventListener("resize", function () {

            if (window.innerWidth > 760) {
                closeMenu();
            }

        });
    }


    // ---------------------------------------
    // 3. ACTIVE NAVIGATION LINK
    // ---------------------------------------

    const navLinks = document.querySelectorAll(
        '.nav-menu a[href^="#"]'
    );

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    if ("IntersectionObserver" in window && sections.length > 0) {

        const sectionObserver = new IntersectionObserver(
            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        navLinks.forEach(function (link) {
                            link.classList.toggle(
                                "active",
                                link.getAttribute("href") === "#" + entry.target.id
                            );
                        });

                    }

                });

            },
            {
                rootMargin: "-25% 0px -60% 0px"
            }
        );

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }


    // ---------------------------------------
    // 4. SERVICE CARD BUTTONS
    // ---------------------------------------

    const serviceSelect = document.getElementById("service");
    const serviceLinks = document.querySelectorAll("[data-service]");

    serviceLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            const selectedService = link.getAttribute("data-service");

            if (serviceSelect && selectedService) {

                const matchingOption = Array.from(
                    serviceSelect.options
                ).find(function (option) {
                    return option.value === selectedService;
                });

                if (matchingOption) {
                    serviceSelect.value = selectedService;
                }
            }

        });

    });


    // ---------------------------------------
    // 5. WHATSAPP CONTACT LINKS
    // ---------------------------------------

    const whatsappLinks = document.querySelectorAll(".whatsapp-link");

    whatsappLinks.forEach(function (link) {

        link.href = "https://wa.me/" + 94779683018;

        link.target = "_blank";
        link.rel = "noopener noreferrer";

    });

    const floatingWhatsApp = document.querySelector(".whatsapp-float");

    if (floatingWhatsApp) {

        floatingWhatsApp.href =
            "https://wa.me/" + 94779683018;

        floatingWhatsApp.target = "_blank";
        floatingWhatsApp.rel = "noopener noreferrer";
    }


    // ---------------------------------------
    // 6. CONTACT FORM - SAVE TO DATABASE FIRST
    // ---------------------------------------

    const serviceForm = document.getElementById("serviceForm");
    const formStatus = document.getElementById("formStatus");

    if (serviceForm) {
        serviceForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!serviceForm.checkValidity()) {
                serviceForm.reportValidity();
                return;
            }

            const fullName = document.getElementById("fullName").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const location = document.getElementById("location").value.trim();
            const service = document.getElementById("service").value;
            const message = document.getElementById("message").value.trim();
            const phoneDigits = phone.replace(/\D/g, "");

            if (phoneDigits.length < 9 || phoneDigits.length > 15) {
                if (formStatus) formStatus.textContent = "Please enter a valid phone number.";
                document.getElementById("phone").focus();
                return;
            }

            const submitButton = serviceForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            if (formStatus) formStatus.textContent = "Saving your service request...";

            try {
                const response = await fetch("/api/service-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fullName, phone, location, service, message })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Could not save request.");

                const jobNumber = result.job_number;
                if (jobNumberInput) jobNumberInput.value = jobNumber;
                const whatsappMessage = [
                    "SADARUWAN WATER SOLUTION",
                    "SERVICE REQUEST",
                    "Job Number: " + jobNumber,
                    "",
                    "Name: " + fullName,
                    "Phone: " + phone,
                    "Location: " + location,
                    "Service: " + service,
                    "",
                    "Description: " + (message || "Not provided"),
                    "",
                    "I would like to enquire about this service."
                ].join("\n");
                const whatsappURL = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(whatsappMessage);
                if (formStatus) formStatus.textContent = "Request saved successfully as " + jobNumber + ". Opening WhatsApp...";
                window.open(whatsappURL, "_blank", "noopener,noreferrer");
                await loadNextJobNumber();
            } catch (error) {
                if (formStatus) formStatus.textContent = error.message + " Please make sure the website server is running.";
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }


    // ---------------------------------------
    // 7. SMOOTH SCROLL FOR INTERNAL LINKS
    // ---------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches ? "auto" : "smooth",
                block: "start"
            });

            // Update the URL fragment without reloading.
            if (history.replaceState) {
                history.replaceState(null, "", targetId);
            }

        });

    });


    // ---------------------------------------
    // 8. OPTIONAL REVEAL ANIMATIONS
    // ---------------------------------------

    const revealElements = document.querySelectorAll(
        ".service-card, .process-card, .about-content, .about-visual"
    );

    if (
        "IntersectionObserver" in window &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {

        revealElements.forEach(function (element) {
            element.classList.add("reveal-ready");
        });

        const revealObserver = new IntersectionObserver(
            function (entries, observer) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("revealed");
                        observer.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.12
            }
        );

        revealElements.forEach(function (element) {
            revealObserver.observe(element);
        });

    }


    console.log("Sadaruwan Water Solution website initialized.");

});