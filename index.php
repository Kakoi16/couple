<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.12.0/dist/cdn.min.js" defer></script>
    <style>
        @media (max-width: 768px) {
            .suki {
                overflow-x: scroll;
            }
        }

        .hidden-content {
            display: none;
        }
    </style>
</head>

<body class=" bg-gray-100">

    <div x-data="{ isSidebarOpen: false, activeContent: 'dashboard' }" class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <aside
            :class="isSidebarOpen ? 'translate-x-0 ease-in-out duration-300' : '-translate-x-full ease-in-out duration-300'"
            class="w-64 bg-blue-800 text-white fixed top-0 left-0 h-full z-40 transform transition-transform lg:translate-x-0 lg:relative flex-shrink-0">
            <div class="py-4 px-6">
                <h1 class="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <nav>
                <ul class="space-y-2 px-4">
                    <li>
                        <a href="#" @click.prevent="activeContent = 'dashboard'; isSidebarOpen = false" class="block py-2 px-4 rounded-md hover:bg-blue-600">Dashboard</a>
                    </li>
                    <li>
                        <a href="#" @click.prevent="activeContent = 'users'; isSidebarOpen = false" class="block py-2 px-4 rounded-md hover:bg-blue-600">Data Kriteria</a>
                    </li>
                    <li>
                        <a href="#" @click.prevent="activeContent = 'files'; isSidebarOpen = false" class="block py-2 px-4 rounded-md hover:bg-blue-600">Daftar Siswa</a>
                    </li>
                    <li>
                        <a href="#" @click.prevent="activeContent = 'settings'; isSidebarOpen = false" class="block py-2 px-4 rounded-md hover:bg-blue-600">Tambah Guru</a>
                    </li>
                    <li>
                        <a href="#" @click.prevent="activeContent = 'usersLogin'; isSidebarOpen = false" class="block py-2 px-4 rounded-md hover:bg-blue-600">Daftar Pengguna</a>
                    </li>
                    <li>
                        <a href="./kakoi.php" class="block py-2 px-4 rounded-md hover:bg-blue-600">Logout</a>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col suki">
            <!-- Header -->
            <header class="bg-white shadow flex justify-between items-center px-6 py-4">
                <!-- Hamburger Menu -->
                <button
                    @click="isSidebarOpen = !isSidebarOpen"
                    class="text-blue-600 lg:hidden focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
                <h2 class="text-xl font-semibold text-gray-800">Welcome, Admin</h2>
            </header>

            <!-- Overlay for small screens -->
            <div
                @click="isSidebarOpen = false"
                x-show="isSidebarOpen"
                x-transition.opacity
                class="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"></div>

            <!-- Dashboard Content -->
            <main class="p-4">
                <div x-show="activeContent === 'dashboard'">
                    <h1>p</h1>

                </div>
                <div x-show="activeContent === 'users'" class="overflow-y-auto h-screen">
                    <h1>1</h1>
                </div>

                <div x-show="activeContent === 'files'">
                    <h3 class="text-lg font-semibold mb-4">Uploaded Files</h3>
                </div>

                <div x-show="activeContent === 'settings'" class=" overflow-y-auto h-[1000vh] ">
                    <h1>3</h1>
                </div>
                <div x-show="activeContent === 'usersLogin'" class="overflow-y-auto h-screen">
                    <h1 class="text-2xl font-bold mb-4">Daftar Pengguna</h1>
                </div>
</body>

</html>