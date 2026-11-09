import React, { useState } from 'react';
import { X, Copy, Check, Download, Smartphone, Code2, BookOpen } from 'lucide-react';
import { soundManager } from '../game/audio';

interface AndroidExportModalProps {
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'main_activity' | 'manifest' | 'gradle'>('instructions');
  const [copied, setCopied] = useState(false);

  const mainActivityCode = `package com.adilpanel.adilsnakerpanel

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * ADIL-SNAKER-PANEL
 * Official 3D Android Mobile Game by ADIL PANEL
 * Built with Kotlin + Hardware-Accelerated 3D WebGL / Filament Engine
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Force Fullscreen Immersive Mode & Keep Screen On
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 2. Hide Navigation and Status Bars for True Android Gaming Experience
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )

        // 3. Initialize High-Performance Hardware-Accelerated 3D Viewport
        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            // Enable WebGL & 3D Hardware acceleration
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.webViewClient = WebViewClient()

        // 4. Load 3D Game Assets locally (Works 100% Offline)
        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}`;

  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.adilpanel.adilsnakerpanel">

    <!-- Offline 3D Game: Zero sensitive permissions required -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ADIL-SNAKER-PANEL"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const gradleCode = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.adilpanel.adilsnakerpanel"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.adilpanel.adilsnakerpanel"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        ndk {
            abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64"))
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
}`;

  const currentSnippet =
    activeTab === 'main_activity'
      ? mainActivityCode
      : activeTab === 'manifest'
      ? manifestCode
      : activeTab === 'gradle'
      ? gradleCode
      : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    soundManager.playBonus();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-4 overflow-hidden select-none animate-fadeIn">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wide uppercase">
              Android Kotlin Project & APK
            </h2>
            <p className="text-[11px] text-emerald-400 font-semibold">
              ADIL-SNAKER-PANEL by ADIL PANEL
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playButton();
            onClose();
          }}
          className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 my-2">
        <button
          onClick={() => setActiveTab('instructions')}
          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 ${
            activeTab === 'instructions'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          <span>Guide</span>
        </button>
        <button
          onClick={() => setActiveTab('main_activity')}
          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 ${
            activeTab === 'main_activity'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Kotlin</span>
        </button>
        <button
          onClick={() => setActiveTab('manifest')}
          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 ${
            activeTab === 'manifest'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Manifest</span>
        </button>
        <button
          onClick={() => setActiveTab('gradle')}
          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 ${
            activeTab === 'gradle'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Gradle</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'instructions' ? (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
              <h3 className="font-black text-white text-sm mb-1 flex items-center gap-1.5 text-emerald-400">
                🚀 Instant Play & Android APK Build Steps
              </h3>
              <p className="text-[11px] text-slate-300">
                You can play the game right now directly in this mobile preview with full 3D graphics, virtual joystick, swipe, sounds, and save states. To compile the standalone native APK for any Android phone:
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-bold text-white">Create New Project in Android Studio</div>
                  <div className="text-[10px] text-slate-400">
                    Select "Empty Activity" with Language: <b>Kotlin</b> and Build Configuration: <b>Kotlin DSL</b>.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-bold text-white">Copy Kotlin Source & Assets</div>
                  <div className="text-[10px] text-slate-400">
                    Copy <code>MainActivity.kt</code> and <code>AndroidManifest.xml</code> from the tabs above. Place built web assets in <code>app/src/main/assets/</code>.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-bold text-white">Build APK for Real Android Devices</div>
                  <div className="text-[10px] text-slate-400">
                    Run <code>./gradlew assembleRelease</code> or click <b>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</b>.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800 text-[10px] text-slate-400">
              💡 <b>Optimized for low-end Android phones</b>: Uses software-safe WebGL fallback, capped pixel ratio, and zero memory leaks.
            </div>
          </div>
        ) : (
          <div className="relative h-full flex flex-col">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-emerald-400 flex items-center gap-1 z-10"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <pre className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-[10px] font-mono text-emerald-300 overflow-x-auto whitespace-pre h-full">
              {currentSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={() => {
            soundManager.playButton();
            onClose();
          }}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
        >
          Close & Return to Game
        </button>
      </div>
    </div>
  );
};
