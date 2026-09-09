package com.veyro.demo;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private TextView status;

    private int dp(float v) {
        return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
    }

    private TextView text(String value, float size, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(Color.rgb(235, 235, 245));
        t.setTypeface(Typeface.DEFAULT, bold ? Typeface.BOLD : Typeface.NORMAL);
        return t;
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(28), dp(20), dp(20));
        root.setBackgroundColor(Color.rgb(12, 14, 20));

        TextView logo = text("VEYRO", 30, true);
        logo.setTextColor(Color.rgb(120, 140, 255));
        root.addView(logo);

        TextView subtitle = text("AI App & 2D Game Builder", 15, false);
        subtitle.setTextColor(Color.rgb(165, 165, 180));
        root.addView(subtitle);

        TextView title = text("Create something new", 25, true);
        title.setPadding(0, dp(28), 0, dp(8));
        root.addView(title);

        EditText prompt = new EditText(this);
        prompt.setHint("Describe your app or game...");
        prompt.setHintTextColor(Color.rgb(120, 120, 135));
        prompt.setTextColor(Color.WHITE);
        prompt.setGravity(Gravity.TOP);
        prompt.setMinHeight(dp(130));
        prompt.setPadding(dp(14), dp(14), dp(14), dp(14));
        root.addView(prompt, new LinearLayout.LayoutParams(-1, dp(140)));

        Button create = new Button(this);
        create.setText("Create with AI");
        create.setAllCaps(false);
        create.setTextSize(16);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, dp(54));
        cp.topMargin = dp(14);
        root.addView(create, cp);

        TextView section = text("Your workspace", 20, true);
        section.setPadding(0, dp(26), 0, dp(10));
        root.addView(section);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        card.setBackgroundColor(Color.rgb(24, 27, 38));

        card.addView(text("Build Engine", 18, true));
        card.addView(text("APK / AAB generation pipeline", 14, false));

        status = text("Ready — waiting for a project", 14, false);
        status.setPadding(0, dp(10), 0, 0);
        card.addView(status);
        root.addView(card, new LinearLayout.LayoutParams(-1, dp(115)));

        create.setOnClickListener(v -> {
            String request = prompt.getText().toString().trim();
            if (request.isEmpty()) {
                status.setText("Write what you want to build first.");
            } else {
                status.setText("AI request queued: " + request);
            }
        });

        ScrollView scroll = new ScrollView(this);
        scroll.addView(root);
        setContentView(scroll);
    }
}
