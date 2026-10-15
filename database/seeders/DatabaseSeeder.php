<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // One demo login is enough for judging; roles come later.
        User::updateOrCreate(
            ['email' => config('services.demo.admin_email')],
            [
                'name' => 'FlowGuard Admin',
                'password' => Hash::make(config('services.demo.admin_password')),
            ],
        );

        $this->call(FlowGuardSeeder::class);
    }
}
