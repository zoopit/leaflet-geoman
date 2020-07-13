describe('Draw Marker', () => {
  const mapSelector = '#map';

  it('enables drag in programatic global edit mode', () => {

    cy.toolbarButton('marker').click();

    cy.wait(1000)

    cy.get(mapSelector)
      .click(150, 250)

    cy.wait(1000)

    cy.window().then(({ map, L }) => {
      map.pm.enableGlobalEditMode()

      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          assert.isTrue(layer.dragging._enabled)
        }
      })
    });

  });

  it('removes markers without error', () => {
    cy.window().then(({ map, L }) => {
      const markerLayer = L.geoJson().addTo(map);

      map.pm.enableDraw('Marker', {
        snappable: false,
      });

      cy.get(mapSelector)
        .click(150, 250)
        .then(() => {
          let l;
          let m;
          map.eachLayer(layer => {
            if (layer._leaflet_id === markerLayer._leaflet_id) {
              l = layer;
            } else if (layer instanceof L.Marker) {
              m = layer;
            }
          });

          l.addLayer(m);
          map.pm.disableDraw();
          l.removeLayer(m);

          return m;
        })
        .as('markerLayer');
    });

    cy.get('@markerLayer').then(markerLayer => {
      markerLayer.pm.disable();
    });
  });

  it('places markers', () => {
    cy.toolbarButton('marker').click();

    cy.get(mapSelector)
      .click(90, 250)
      .click(150, 50)
      .click(500, 50)
      .click(500, 300);

    cy.get('.leaflet-marker-icon').should($p => {
      expect($p).to.have.length(5);
    });

    cy.toolbarButton('marker').click();

    cy.get('.leaflet-marker-icon').should($p => {
      expect($p).to.have.length(4);
    });
  });


  it('add interactive:false marker to the map and enable edit', () => {
    // Adds a interactive Marker to the map and enable / disable the edit mode to check if a error is thrown because it is not draggable
    cy.window().then(({ map, L }) => L.marker([51.505, -0.09], { interactive: false }).addTo(map)).as('marker');

    cy.toolbarButton('edit').click();

    cy.wait(100);

    cy.toolbarButton('edit').click();

    cy.get('@marker').then( marker  => {
        marker.removeFrom(marker._map);
    });
  });



  it('calls pm:drag-events on Marker drag', () => {

    let dragstart = false;
    let drag = false;
    let dragend = false;

    cy.window().then(({map}) =>{
      map.on('pm:create',(e)=>{
        e.layer.on('pm:dragstart',()=>{
          dragstart = true;
        });
        e.layer.on('pm:drag',()=>{
          drag = true;
        });
        e.layer.on('pm:dragend',()=>{
          dragend = true;
        });
      })

    });

    cy.toolbarButton('marker').click();
    cy.wait(1000)
    cy.get(mapSelector)
      .click(150, 250)
    cy.wait(1000)
    cy.toolbarButton('marker').click();
    cy.toolbarButton('drag').click();

    cy.window().then(({ Hand }) => {
      const handMarker = new Hand({
        timing: 'frame',
        onStop: () => {
          expect(dragstart).to.equal(true);
          expect(drag).to.equal(true);
          expect(dragend).to.equal(true);
        }
      });
      const toucherMarker = handMarker.growFinger('mouse');
      toucherMarker.wait(100).moveTo(150, 240, 100).down().wait(500).moveTo(170, 290, 400).up().wait(100) // Not allowed

    });
  });

});
