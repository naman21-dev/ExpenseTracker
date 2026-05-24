import React, { useEffect, useRef, useState } from 'react'
import { navbarStyles } from '../assets/dummyStyles'
import img1 from '../assets/Xpensy_logo.png'
import { ChevronDown, User, LogOut, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE_URL = 'https://xpensy.onrender.com/api'

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate();
    const menuRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);

    const user = propUser || {
        name: "",
        email: "",
    };

    //to fetch user data from server
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get(`${BASE_URL}/user/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const userData = response.data.user || response.data;
                setUser(userData);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        if (!propUser) {
            fetchUserData();
        }
    }, [propUser]);

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    const handleLogoutClick = () => {
        setMenuOpen(false);
        localStorage.removeItem('token');
        onLogout?.();
        navigate('/login');
    };

    //closes the menu if clicked outside the box
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                {/* Logo Section */}
                <div className={navbarStyles.logoContainer} onClick={() => navigate("/")}>
                    <div className={navbarStyles.logoImage}>
                        <img src={img1} alt="Logo" />
                    </div>
                    <span className={navbarStyles.logoText}>Your Personalized Expense Tracker</span>
                </div>

                {/* User Profile Section */}
                {user && (
                    <div className={navbarStyles.userContainer} ref={menuRef}>
                        <button className={navbarStyles.userButton} onClick={toggleMenu}>
                            <div className="relative">
                                <div className={navbarStyles.userAvatar}>
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className={navbarStyles.statusIndicator}></div>
                            </div>

                            <div className={navbarStyles.userTextContainer}>
                                <p className={navbarStyles.username}>{user?.name || "User"}</p>
                                <p className={navbarStyles.userEmail}>{user?.email || "user@expensetracker.com"}</p>
                            </div>

                            <ChevronDown className={navbarStyles.chevronIcon(menuOpen)} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className={navbarStyles.dropdownMenu}>
                                <div className={navbarStyles.dropdownHeader}>
                                    <div className="flex items-center gap-3">
                                        <div className={navbarStyles.dropdownAvatar}>
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <div className={navbarStyles.dropdownName}>
                                                {user?.name || "User"}
                                            </div>
                                            <div className={navbarStyles.dropdownEmail}>
                                                {user?.email || "user@expensetracker.com"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={navbarStyles.menuItemContainer}>
                                    <button
                                        className={navbarStyles.menuItem}
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                    >
                                        <User className="w-4 h-4" />
                                        <span>My Profile</span>
                                    </button>
                                </div>

                                <div className={navbarStyles.mobileItemBorder}>
                                    <button
                                        className={navbarStyles.logoutButton}
                                        onClick={handleLogoutClick}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar