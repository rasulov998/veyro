package com.veyro.demo;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public final class MainActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        TextView view = new TextView(this);
        view.setText("VEYRO — Build Engine Demo");
        view.setTextSize(22);
        view.setPadding(48, 48, 48, 48);
        setContentView(view);
    }
}
