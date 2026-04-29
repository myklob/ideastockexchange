-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keep,includedescriptorclasses class com.ideastockexchange.app.**$$serializer { *; }
-keepclassmembers class com.ideastockexchange.app.** {
    *** Companion;
}
-keepclasseswithmembers class com.ideastockexchange.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}
