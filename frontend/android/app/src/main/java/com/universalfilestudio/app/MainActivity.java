package com.universalfilestudio.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.universalfilestudio.app.plugins.UniversalNativeEnginePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UniversalNativeEnginePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
