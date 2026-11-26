package com.afrocuisto.app

import android.app.Application
import android.os.Build
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.GifDecoder
import coil.decode.ImageDecoderDecoder
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.afrocuisto.app.data.network.NetworkMonitor
import com.afrocuisto.app.data.repository.AppNotificationCenter
import com.afrocuisto.app.data.repository.BoutiqueRepository
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.data.repository.ShoppingRepository

class AfrocuistoApplication : Application(), ImageLoaderFactory {
    override fun onCreate() {
        super.onCreate()
        NetworkMonitor.init(this)
        RecipeRepository.init(this)
        ShoppingRepository.init(this)
        BoutiqueRepository.init(this)
        AppNotificationCenter.init(this)
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .components {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    add(ImageDecoderDecoder.Factory())
                } else {
                    add(GifDecoder.Factory())
                }
            }
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("coil_image_cache"))
                    .maxSizeBytes(100L * 1024L * 1024L)
                    .build()
            }
            .bitmapFactoryMaxParallelism(4)
            .respectCacheHeaders(false)
            .crossfade(180)
            .build()
    }
}
